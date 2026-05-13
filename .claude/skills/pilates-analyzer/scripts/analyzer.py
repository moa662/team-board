#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
核心数据分析模块
"""
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path


class PilatesAnalyzer:
    """普拉提门店分析器"""

    def __init__(self, project_path: str or Path):
        self.project_path = Path(project_path)
        self.db_path = self.project_path / 'data' / 'pilates_data.db'
        self._init_db()

    def _init_db(self):
        """初始化数据库"""
        self.db_path.parent.mkdir(exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS appointment_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_id VARCHAR(20),
                member_name VARCHAR(100),
                member_phone VARCHAR(20),
                coach_name VARCHAR(50),
                course_name VARCHAR(100),
                card_name VARCHAR(100),
                class_time DATETIME,
                classification VARCHAR(20),
                is_consumption BOOLEAN,
                amount DECIMAL(10,2),
                source_file VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
            conn.commit()

    def import_excel(self, file_path: str, store_id: str) -> int:
        """导入单个Excel文件"""
        df = pd.read_excel(file_path)
        success_count = 0

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            for _, row in df.iterrows():
                try:
                    member_name = str(row.iloc[2]) if len(row) > 2 else ''
                    class_time = str(row.iloc[4]) if len(row) > 4 else ''
                    coach_name = str(row.iloc[7]) if len(row) > 7 else ''
                    course_name = str(row.iloc[5]) if len(row) > 5 else ''
                    card_name = str(row.iloc[14]) if len(row) > 14 else ''

                    class_time_val = None
                    try:
                        class_time_val = pd.Timestamp(class_time).strftime('%Y-%m-%d %H:%M:%S')
                    except:
                        pass

                    cursor.execute("""
                    INSERT INTO appointment_records
                    (store_id, member_name, member_phone, coach_name, course_name,
                     card_name, class_time, classification, is_consumption, amount, source_file)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        store_id, member_name, '', coach_name, course_name,
                        card_name, class_time_val, '私教', True, 190,
                        str(file_path)
                    ))
                    success_count += 1
                except Exception as e:
                    continue
            conn.commit()
        return success_count

    def import_from_directory(self, dir_path: str) -> int:
        """从目录批量导入Excel文件"""
        dir_path = Path(dir_path)
        total = 0
        store_mapping = {
            '新世纪': 'newcentury',
            '美乐城': 'meilecheng',
            '鑫港': 'xingang',
            '拉德芳斯': 'lafangsi'
        }

        for excel_file in dir_path.glob('**/*.xlsx'):
            for name_key, store_id in store_mapping.items():
                if name_key in excel_file.name:
                    count = self.import_excel(str(excel_file), store_id)
                    print(f"  {excel_file.name}: {count} 条 -> {store_id}")
                    total += count
                    break

        return total

    def get_all_data(self, month: str = None) -> pd.DataFrame:
        """获取所有数据"""
        query = "SELECT * FROM appointment_records"
        params = []
        if month:
            query += " WHERE strftime('%Y-%m', class_time) = ?"
            params.append(month)

        with sqlite3.connect(self.db_path) as conn:
            return pd.read_sql(query, conn, params=params)

    def calculate_rfm(self, df: pd.DataFrame) -> pd.DataFrame:
        """计算RFM指标
        R (Recency): 最近一次消费距今天数，越小越好
        F (Frequency): 消费频率（总次数），越大越好
        M (Monetary): 消费总金额，越大越好
        """
        if len(df) == 0:
            return pd.DataFrame()

        analysis_date = datetime.now()
        rfm = df.groupby('member_name').agg({
            'class_time': lambda x: (analysis_date - pd.to_datetime(x.max())).days,
            'id': 'count',
            'amount': 'sum'
        }).rename(columns={
            'class_time': 'recency',
            'id': 'frequency',
            'amount': 'monetary'
        }).reset_index()

        # 五分位打分：R越小越好，F/M越大越好
        # R：最近消费天数，越小分数越高
        rfm['r_score'] = pd.qcut(rfm['recency'].rank(method='first', ascending=False), 5, labels=[1, 2, 3, 4, 5]).astype(int)
        # F：消费频率
        rfm['f_score'] = pd.qcut(rfm['frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5]).astype(int)
        # M：消费金额
        rfm['m_score'] = pd.qcut(rfm['monetary'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5]).astype(int)

        # 综合评分（权重：R=40%, F=35%, M=25%）
        rfm['rfm_score'] = (
            rfm['r_score'] * 0.4 +
            rfm['f_score'] * 0.35 +
            rfm['m_score'] * 0.25
        ).round(2)

        return rfm

    def classify_member_level(self, rfm_df: pd.DataFrame) -> dict:
        """会员分层"""
        levels = {
            'high_value': 0, 'active': 0, 'new_member': 0,
            'sleeping': 0, 'churned': 0
        }

        for _, row in rfm_df.iterrows():
            recency = row['recency']
            frequency = row['frequency']

            if recency <= 7 and frequency >= 8:
                levels['high_value'] += 1
            elif 7 < recency <= 30 and 4 <= frequency < 8:
                levels['active'] += 1
            elif recency <= 30 and frequency <= 3:
                levels['new_member'] += 1
            elif 30 < recency <= 90:
                levels['sleeping'] += 1
            else:
                levels['churned'] += 1

        total = len(rfm_df)
        return {
            k: {'count': v, 'percentage': round(v / total * 100, 1) if total > 0 else 0}
            for k, v in levels.items()
        }

    def calculate_churn_risk(self, df: pd.DataFrame) -> dict:
        """计算流失风险"""
        risk = {'high': 0, 'medium': 0, 'low': 0}
        analysis_date = datetime.now()

        for member in df['member_name'].unique():
            member_df = df[df['member_name'] == member]
            last_seen = pd.to_datetime(member_df['class_time']).max()
            days_since = (analysis_date - last_seen).days

            if days_since > 60:
                risk['high'] += 1
            elif days_since > 30:
                risk['medium'] += 1
            else:
                risk['low'] += 1

        return risk

    def calculate_weekday_dist(self, df: pd.DataFrame) -> dict:
        """计算星期分布"""
        if len(df) == 0 or 'class_time' not in df.columns:
            return {}

        df = df.copy()
        df['weekday'] = pd.to_datetime(df['class_time']).dt.dayofweek
        weekday_map = {0: '周一', 1: '周二', 2: '周三', 3: '周四', 4: '周五', 5: '周六', 6: '周日'}
        df['weekday_cn'] = df['weekday'].map(weekday_map)

        dist = df['weekday_cn'].value_counts().to_dict()
        # 确保按顺序返回
        ordered = {}
        for w in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']:
            ordered[w] = int(dist.get(w, 0))
        return ordered

    def calculate_time_slot_dist(self, df: pd.DataFrame) -> dict:
        """计算时段分布"""
        if len(df) == 0 or 'class_time' not in df.columns:
            return {}

        df = df.copy()
        df['hour'] = pd.to_datetime(df['class_time']).dt.hour

        def get_slot(h):
            if 6 <= h <= 11:
                return '上午(06-11点)'
            elif 12 <= h <= 16:
                return '下午(12-16点)'
            else:
                return '晚上(17-21点)'

        df['time_slot'] = df['hour'].apply(get_slot)
        dist = df['time_slot'].value_counts().to_dict()
        return {k: int(v) for k, v in dist.items()}

    def calculate_card_type_dist(self, df: pd.DataFrame) -> dict:
        """计算卡种分布"""
        if len(df) == 0 or 'card_name' not in df.columns:
            return {}

        dist = df['card_name'].value_counts().head(10).to_dict()
        return {str(k): int(v) for k, v in dist.items()}

    def calculate_coach_stats(self, df: pd.DataFrame) -> list:
        """计算教练统计"""
        if len(df) == 0 or 'coach_name' not in df.columns or 'member_name' not in df.columns:
            return []

        coach_stats = df.groupby('coach_name').agg(
            students=('member_name', 'nunique'),
            sessions=('id', 'count')
        ).reset_index()
        coach_stats['rate'] = (coach_stats['sessions'] / coach_stats['students']).round(2)
        coach_top = coach_stats.sort_values('rate', ascending=False).head(10)

        return [
            {'name': row['coach_name'], 'students': int(row['students']),
             'sessions': int(row['sessions']), 'rate': float(row['rate'])}
            for _, row in coach_top.iterrows()
        ]

    def calculate_store_coach_stats(self, df: pd.DataFrame) -> dict:
        """按门店分组计算教练统计"""
        if len(df) == 0 or 'store_id' not in df.columns:
            return {}

        store_names = {
            'newcentury': '新世纪',
            'meilecheng': '美乐城',
            'xingang': '鑫港',
            'lafangsi': '拉德芳斯'
        }

        result = {}
        for store_id in df['store_id'].unique():
            store_df = df[df['store_id'] == store_id]
            coach_stats = store_df.groupby('coach_name').agg(
                students=('member_name', 'nunique'),
                sessions=('id', 'count')
            ).reset_index()
            coach_stats['rate'] = (coach_stats['sessions'] / coach_stats['students']).round(2)
            coach_top = coach_stats.sort_values('rate', ascending=False).head(5)

            result[store_id] = {
                'name': store_names.get(store_id, store_id),
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

    def calculate_daily_trend(self, df: pd.DataFrame) -> dict:
        """计算每日趋势"""
        if len(df) == 0 or 'class_time' not in df.columns:
            return {}

        df = df.copy()
        df['date'] = pd.to_datetime(df['class_time']).dt.strftime('%m-%d')
        daily = df.groupby('date').size().sort_index().to_dict()
        return {k: int(v) for k, v in daily.items()}

    def analyze(self, month: str = None) -> dict:
        """执行完整分析"""
        df = self.get_all_data(month)

        rfm_df = self.calculate_rfm(df)
        member_levels = self.classify_member_level(rfm_df)
        churn_risk = self.calculate_churn_risk(df)

        # 分布统计
        weekday_dist = self.calculate_weekday_dist(df)
        time_slot_dist = self.calculate_time_slot_dist(df)
        card_type_dist = self.calculate_card_type_dist(df)
        coach_stats = self.calculate_coach_stats(df)
        daily_trend = self.calculate_daily_trend(df)

        # Top会员 - 按RFM综合评分降序排序
        top_members = rfm_df.sort_values('rfm_score', ascending=False).head(10)
        top_members_list = [
            {
                'name': row['member_name'],
                'lessons': int(row['frequency']),
                'amount': float(row['monetary']),
                'rfm': float(row['rfm_score'])
            }
            for _, row in top_members.iterrows()
        ]

        # 月度趋势
        monthly = df.copy()
        monthly['month'] = pd.to_datetime(monthly['class_time']).dt.to_period('M')
        monthly_stats = monthly.groupby('month').size().to_dict()

        # 门店统计
        store_stats = df.groupby('store_id').size().to_dict()

        store_coach_stats = self.calculate_store_coach_stats(df)

        return {
            'total_records': len(df),
            'total_members': df['member_name'].nunique(),
            'high_value_count': member_levels['high_value']['count'],
            'high_risk_count': churn_risk['high'],
            'member_levels': member_levels,
            'churn_risk': churn_risk,
            'top_members': top_members_list,
            'monthly_stats': {str(k): int(v) for k, v in monthly_stats.items()},
            'store_stats': store_stats,
            'weekday_dist': weekday_dist,
            'time_slot_dist': time_slot_dist,
            'card_type_dist': card_type_dist,
            'coach_stats': coach_stats,
            'store_coach_stats': store_coach_stats,
            'daily_trend': daily_trend
        }

    def get_analysis_data(self) -> dict:
        """获取看板所需的完整数据"""
        return self.analyze()
