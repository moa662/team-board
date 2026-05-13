#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
普拉提门店经营数据分析器 - 完全按照原始 data-toolkit 逻辑
计算逻辑来源：C:/Users/Mao/Downloads/看板计算逻辑速查表.md
"""
import sys
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

# ===================== 配置常量（完全按照速查表）=====================

# 五分类判断白名单
PRIVATE_CARDS = [
    '专属私教通用卡',
    '4980代言人',
    '代言人3000',
    '代言人3000（私教）',
    '1679训练课',
    '500特惠卡（私教）',
    '298福利卡',
    '第一期新星启航私教次数卡',
    '980/1390私教卡(6次卡)',
]

EXCLUDE_CARDS = ['员工代约卡']

# 门店ID映射
STORE_NAMES = {
    'newcentury': '新世纪',
    'meilecheng': '美乐城',
    'xingang': '鑫港',
    'lafangsi': '拉德芳斯'
}

# 星期映射
WEEKDAY_MAP = {0: '周一', 1: '周二', 2: '周三', 3: '周四', 4: '周五', 5: '周六', 6: '周日'}
WEEKDAY_ORDER = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

# 时段映射（按照速查表逻辑）
TIME_RANGES = {
    '上午': [6, 7, 8, 9, 10, 11],
    '下午': [12, 13, 14, 15, 16],
    '晚上': [17, 18, 19, 20, 21, 22, 23]
}

# 业务参数
LESSON_PRICE = 190  # 单价190元/节
SALES_RATE_CAP = 1.5  # 销售达成率封顶150%


class PilatesAnalyzer:
    """普拉提门店分析器 - 完全按照原始计算逻辑"""

    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.data_dir = self.project_path / 'data'

    # ========================================
    # 阶段1: 智能列名匹配（解决硬编码问题）
    # ========================================
    def smart_load_excel(self, file_path: str) -> Tuple[pd.DataFrame, Dict]:
        """
        智能加载Excel，自动匹配列名（不再硬编码）
        返回: (DataFrame, 列名映射字典)
        """
        df_raw = pd.read_excel(file_path)
        actual_columns = list(df_raw.columns)

        # 列名候选映射（按照速查表4.1节）
        column_candidates = {
            'class_time': ['上课时间', '上课日期', '时间'],
            'course_name': ['课程名称', '课程名', '课程'],
            'card_name': ['会员卡名称', '卡种名称', '卡名', '会员卡'],
            'member_name': ['会员名称', '姓名', '会员'],
            'coach_name': ['教练名称', '教练名', '教练'],
        }

        # 为每个逻辑列找到最匹配的实际列
        resolved_mapping = {}
        for logical_col, candidates in column_candidates.items():
            matched = None
            for candidate in candidates:
                for actual in actual_columns:
                    if candidate in str(actual):
                        matched = actual
                        break
                if matched:
                    break
            if matched:
                resolved_mapping[logical_col] = matched

        # 重命名列
        reverse_map = {v: k for k, v in resolved_mapping.items()}
        df = df_raw.rename(columns=reverse_map)

        return df, resolved_mapping

    # ========================================
    # 阶段2: 数据清洗
    # ========================================
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """数据清洗（按照速查表第四章）"""
        # 1. 时间字段解析
        if 'class_time' in df.columns:
            df['class_time'] = pd.to_datetime(df['class_time'], errors='coerce')

        # 2. 排除卡种（员工代约卡等）
        if 'card_name' in df.columns:
            for card in EXCLUDE_CARDS:
                df = df[~df['card_name'].fillna('').astype(str).str.contains(card, na=False)]

        return df

    # ========================================
    # 阶段3: 五分类判断（核心！按照速查表2.1节）
    # ========================================
    def classify_five_types(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        五分类判断（按优先级）：
        1. 热玛吉 → 2. 定制私教 → 3. 轮换 → 4. 团课
        另外单独统计：体验课
        """
        results = {}

        # 先分离体验课（按课程名称，不是卡名！速查表4.2节）
        is_experience = pd.Series([False] * len(df))
        if 'course_name' in df.columns:
            is_experience = df['course_name'].fillna('').astype(str).str.contains('体验', na=False)

        df_experience = df[is_experience].copy()
        df_work = df[~is_experience].copy()  # 工作数据（非体验课）

        results['experience'] = {
            'count': len(df_experience),
            'df': df_experience
        }

        # 五分类判断（速查表2.1节）
        def classify_row(row):
            card_name = str(row.get('card_name', ''))

            # 1. 卡名含"热玛吉" → 热玛吉（计入耗课）
            if '热玛吉' in card_name:
                return '热玛吉'

            # 2. 卡名在私教白名单 → 定制私教（计入耗课）
            if card_name in PRIVATE_CARDS:
                return '定制私教'

            # 3. 卡名含"轮换" → 轮换（不计入耗课）
            if '轮换' in card_name:
                return '轮换'

            # 4. 其余 → 团课（不计入耗课）
            return '团课'

        df_work['classification'] = df_work.apply(classify_row, axis=1)

        # 统计各分类数量
        results['private'] = {
            'count': len(df_work[df_work['classification'] == '定制私教']),
            'df': df_work[df_work['classification'] == '定制私教']
        }
        results['thermage'] = {
            'count': len(df_work[df_work['classification'] == '热玛吉']),
            'df': df_work[df_work['classification'] == '热玛吉']
        }
        results['rotation'] = {
            'count': len(df_work[df_work['classification'] == '轮换']),
            'df': df_work[df_work['classification'] == '轮换']
        }
        results['group'] = {
            'count': len(df_work[df_work['classification'] == '团课']),
            'df': df_work[df_work['classification'] == '团课']
        }

        # 耗课记录 = 定制私教 + 热玛吉（速查表1.1节）
        consumption_df = pd.concat([
            results['private']['df'],
            results['thermage']['df']
        ])
        results['consumption'] = {
            'count': len(consumption_df),
            'df': consumption_df
        }
        results['work_df'] = df_work  # 非体验课的所有记录（用于扩展统计）

        return results

    # ========================================
    # 阶段4: 核心指标计算（按照速查表第一章）
    # ========================================
    def calculate_metrics(self, class_results: Dict, indicators: Dict = None) -> Dict:
        """
        计算所有核心指标
        indicators: 指标录入表数据（如提供，优先使用）
        """
        consumption_df = class_results['consumption']['df']
        metrics = {}

        # 1. 基础分类数量
        metrics['experience'] = class_results['experience']['count']
        metrics['rotation'] = class_results['rotation']['count']
        metrics['group'] = class_results['group']['count']
        metrics['training'] = class_results['private']['count']  # 私教耗课
        metrics['hotmassage'] = class_results['thermage']['count']  # 热玛吉

        # 2. 总耗课（优先用指标录入表，否则用Excel计算！速查表1.1节）
        if indicators and 'totalLessons' in indicators:
            metrics['total_lessons'] = indicators['totalLessons']
        else:
            metrics['total_lessons'] = class_results['consumption']['count']

        # 3. 出勤量（耗课记录的会员去重数，速查表1.3节）
        if 'member_name' in consumption_df.columns:
            metrics['attendance_volume'] = consumption_df['member_name'].nunique()
        else:
            metrics['attendance_volume'] = 0

        # 4. ≥2次出勤人数（速查表1.3节）
        if 'member_name' in consumption_df.columns:
            member_attend = consumption_df.groupby('member_name').size()
            metrics['active_members'] = len(member_attend[member_attend >= 2])
        else:
            metrics['active_members'] = 0

        # 5. 耗课金额 = 总耗课 × 190（速查表1.1节）
        metrics['amount'] = int(metrics['total_lessons'] * LESSON_PRICE)

        # 6. 人效 = 总耗课 ÷ 出勤量（速查表1.5节）
        metrics['human_efficiency'] = round(
            metrics['total_lessons'] / metrics['attendance_volume'], 2
        ) if metrics['attendance_volume'] > 0 else 0

        # 7. 指标录入表相关计算（速查表1.2、1.4节）
        if indicators:
            # 会员量（在册）
            total_members = indicators.get('totalMembers', 0)
            metrics['total_members'] = total_members

            # 出勤率 = ≥2次出勤量 ÷ 会员量 × 100%
            metrics['active_rate'] = round(
                metrics['active_members'] / total_members * 100, 1
            ) if total_members > 0 else 0

            # 销售相关
            metrics['sales_volume'] = indicators.get('salesVolume', 0)
            metrics['renewal_volume'] = indicators.get('renewalVolume', 0)
            metrics['sales_amount'] = indicators.get('salesAmount', 0)
            metrics['sales_target'] = indicators.get('salesTarget', 0)
            metrics['balance_line'] = indicators.get('balanceLine', 0)
            metrics['exp_normal_rate'] = indicators.get('expNormalRate', 0)

            # 盈亏达成率 = 销售金额 ÷ 盈亏平衡线 × 100%
            metrics['profit_rate'] = round(
                metrics['sales_amount'] / metrics['balance_line'] * 100, 1
            ) if metrics['balance_line'] > 0 else 0

            # 销售达成率（封顶150%）
            sales_rate_raw = metrics['sales_amount'] / metrics['sales_target'] if metrics['sales_target'] > 0 else 0
            metrics['sales_rate'] = round(min(sales_rate_raw, SALES_RATE_CAP) * 100, 1)

            # 续费转耗率 = 续课量 ÷ 总耗课 × 100%
            metrics['renewal_ratio'] = round(
                metrics['renewal_volume'] / metrics['total_lessons'] * 100, 1
            ) if metrics['total_lessons'] > 0 else 0

            # 销耗比 = 销课量 ÷ 总耗课 × 100%
            metrics['sales_ratio'] = round(
                metrics['sales_volume'] / metrics['total_lessons'] * 100, 1
            ) if metrics['total_lessons'] > 0 else 0

        return metrics

    # ========================================
    # 阶段5: 扩展统计（按照速查表第三章）
    # ========================================
    def calculate_extended(self, df_work: pd.DataFrame) -> Dict:
        """计算扩展统计指标"""
        extended = {}

        # 1. 每日趋势（速查表3.1节）
        if 'class_time' in df_work.columns:
            df_work['上课日期'] = df_work['class_time'].dt.strftime('%m-%d')
            daily = df_work.groupby('上课日期').size()
            extended['dailyTrend'] = {str(k): int(v) for k, v in daily.items()}

        # 2. 教练人效排行（速查表3.2节）
        if 'coach_name' in df_work.columns and 'member_name' in df_work.columns:
            coach_stats = df_work.groupby('coach_name').agg(
                students=('member_name', 'nunique'),  # 该教练服务的不重复会员数
                sessions=('member_name', 'count')     # 该教练的耗课节数
            ).reset_index()
            coach_stats['rate'] = coach_stats.apply(
                lambda r: round(r['sessions'] / r['students'], 2) if r['students'] > 0 else 0,
                axis=1
            )
            coach_list = coach_stats.sort_values('rate', ascending=False).head(10)
            extended['coachPerformance'] = [
                {'name': row['coach_name'], 'students': int(row['students']),
                 'sessions': int(row['sessions']), 'rate': float(row['rate'])}
                for _, row in coach_list.iterrows()
            ]

        # 3. 星期分布（速查表3.3节）
        if 'class_time' in df_work.columns:
            df_work['weekday'] = df_work['class_time'].dt.dayofweek
            df_work['weekday_cn'] = df_work['weekday'].map(WEEKDAY_MAP)
            week_dist = {}
            for d in WEEKDAY_ORDER:
                week_dist[d] = int(len(df_work[df_work['weekday_cn'] == d]))
            extended['weekdayDistribution'] = week_dist

        # 4. 时段分布（速查表3.4节）
        if 'class_time' in df_work.columns:
            df_work['hour'] = df_work['class_time'].dt.hour

            def get_time_slot(h):
                if h in TIME_RANGES['上午']:
                    return '上午'
                elif h in TIME_RANGES['下午']:
                    return '下午'
                else:
                    return '晚上'

            df_work['时段'] = df_work['hour'].apply(get_time_slot)
            time_dist = df_work['时段'].value_counts()
            extended['timeSlotDistribution'] = {str(k): int(v) for k, v in time_dist.items()}

        # 5. 卡种分布（速查表3.5节）
        if 'card_name' in df_work.columns:
            card_dist = df_work['card_name'].value_counts()
            extended['cardDistribution'] = {str(k): int(v) for k, v in card_dist.items()}

        return extended

    # ========================================
    # 阶段6: 按门店分组的教练分析
    # ========================================
    def calculate_store_coach_stats(self, df_work: pd.DataFrame, store_col: str = 'store_id') -> Dict:
        """
        按门店分组计算教练统计
        返回格式: {store_id: {name, total_coaches, total_students, total_sessions, coaches: []}}
        """
        if store_col not in df_work.columns:
            return {}

        result = {}
        for store_id in df_work[store_col].unique():
            store_df = df_work[df_work[store_col] == store_id]

            if 'coach_name' in store_df.columns and 'member_name' in store_df.columns:
                coach_stats = store_df.groupby('coach_name').agg(
                    students=('member_name', 'nunique'),
                    sessions=('member_name', 'count')
                ).reset_index()
                coach_stats['rate'] = coach_stats.apply(
                    lambda r: round(r['sessions'] / r['students'], 2) if r['students'] > 0 else 0,
                    axis=1
                )
                coach_top = coach_stats.sort_values('rate', ascending=False).head(5)

                result[store_id] = {
                    'name': STORE_NAMES.get(store_id, store_id),
                    'total_coaches': len(coach_stats),
                    'total_students': store_df['member_name'].nunique(),
                    'total_sessions': len(store_df),
                    'coaches': [
                        {'name': row['coach_name'], 'students': int(row['students']),
                         'sessions': int(row['sessions']), 'rate': float(row['rate'])}
                        for _, row in coach_top.iterrows()
                    ]
                }

        return result

    # ========================================
    # 主流程：单个门店分析
    # ========================================
    def analyze_store(self, excel_path: str, store_id: str, indicators: Dict = None) -> Dict:
        """分析单个门店的数据"""
        # 1. 加载Excel
        df, col_mapping = self.smart_load_excel(excel_path)

        # 2. 数据清洗
        df_clean = self.clean_data(df)

        # 3. 五分类判断
        class_results = self.classify_five_types(df_clean)

        # 4. 核心指标计算
        metrics = self.calculate_metrics(class_results, indicators)

        # 5. 扩展统计（用非体验课的工作数据）
        extended = self.calculate_extended(class_results['work_df'])

        # 6. 构造输出（按照速查表5.2节格式）
        result = {
            'id': store_id,
            'name': STORE_NAMES.get(store_id, store_id),
            'month': indicators.get('month', '') if indicators else '',
            'consumption': {
                'lessons': metrics['total_lessons'],  # 总耗课（节，来自指标录入表）
                'private': metrics['training'],       # 定制私教（节）
                'attendanceVolume': metrics['attendance_volume'],  # 出勤量（人，会员去重）
                'amount': metrics['amount']           # 耗课金额
            },
            'training': metrics['training'],          # 私教耗课（同private）
            'hotmassage': metrics['hotmassage'],      # 热玛吉耗课
            'rotation': metrics['rotation'],          # 轮换（不计入耗课）
            'group': metrics['group'],                # 团课（不计入耗课）
            'experience': metrics['experience'],      # 体验课节数
            'humanEfficiency': metrics['human_efficiency'],  # 人效
            'activeMembers': metrics['active_members'],       # ≥2次出勤人数
            'extended': extended
        }

        # 如果有指标录入表数据
        if indicators:
            result.update({
                'salesVolume': indicators.get('salesVolume', 0),
                'renewalVolume': indicators.get('renewalVolume', 0),
                'renewalConsumptionRatio': metrics.get('renewal_ratio', 0),
                'salesAmount': indicators.get('salesAmount', 0),
                'salesTarget': indicators.get('salesTarget', 0),
                'expNormalRate': indicators.get('expNormalRate', 0),
                'profitRate': metrics.get('profit_rate', 0),
                'balanceLine': indicators.get('balanceLine', 0),
                'activeRate': metrics.get('active_rate', 0),
            })
            result['extended']['totalMembers'] = indicators.get('totalMembers', 0)

        return result

    # ========================================
    # 主流程：批量分析所有门店
    # ========================================
    def analyze_all_stores(self, excel_files: Dict[str, str], indicators_dict: Dict[str, Dict] = None) -> Dict:
        """
        批量分析所有门店
        excel_files: {store_id: excel_file_path}
        indicators_dict: {store_id: indicators_dict}
        """
        stores_data = []

        for store_id, excel_path in excel_files.items():
            indicators = indicators_dict.get(store_id) if indicators_dict else None
            store_data = self.analyze_store(excel_path, store_id, indicators)
            stores_data.append(store_data)

        # 计算汇总数据（所有门店合并）
        all_stores_df = []
        for store_id, excel_path in excel_files.items():
            df, _ = self.smart_load_excel(excel_path)
            df['store_id'] = store_id
            all_stores_df.append(df)

        if all_stores_df:
            combined_df = pd.concat(all_stores_df, ignore_index=True)
            combined_clean = self.clean_data(combined_df)
            class_results = self.classify_five_types(combined_clean)

            # 按门店分组的教练统计
            store_coach_stats = self.calculate_store_coach_stats(class_results['work_df'])
        else:
            store_coach_stats = {}

        return {
            'stores': stores_data,
            'storeCoachStats': store_coach_stats
        }


# ===================== 辅助函数：生成JS输出（按照速查表5.2节）=====================

def generate_js_output(data: Dict, output_path: str) -> str:
    """
    生成看板可用的JS数据文件（按照速查表5.2节IIFE格式）
    禁止使用 const 或 export！
    """
    import json

    js_content = f"""(function() {{
    window.STORES_DATA = {json.dumps(data, ensure_ascii=False, indent=4)}
}})();"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    return output_path
