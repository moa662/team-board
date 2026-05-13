#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
普拉提门店经营数据分析 Skill 主入口
完全按照原始 data-toolkit 计算逻辑
"""
import sys
import os
import argparse
import pandas as pd
from pathlib import Path

# 将skill根目录加入路径
SKILL_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(SKILL_DIR / 'scripts'))

from pilates_analyzer import PilatesAnalyzer, generate_js_output
from dashboard import DashboardGenerator


def read_indicators_sheet(file_path: str, store_id: str) -> dict:
    """读取指标录入表"""
    try:
        df = pd.read_excel(file_path)
        # 简单实现：假设指标录入表有标准列名
        # 实际项目中可以扩展为列名模糊匹配
        indicators = {}
        for _, row in df.iterrows():
            if len(row) >= 2:
                key = str(row.iloc[0]).strip()
                value = row.iloc[1]
                indicators[key] = value
        return indicators
    except Exception as e:
        print(f"[!] 指标录入表读取失败: {e}")
        return {}


def main():
    parser = argparse.ArgumentParser(description='普拉提门店经营数据分析工具')
    parser.add_argument('--action', '-a', default='full',
                       choices=['import', 'analyze', 'dashboard', 'full'],
                       help='执行操作类型')
    parser.add_argument('--month', '-m', default='', help='分析月份 YYYY-MM')
    parser.add_argument('--data-path', '-d', default='', help='Excel数据目录路径')
    parser.add_argument('--project-path', '-p', default='', help='项目根目录路径')
    parser.add_argument('--store', '-s', default='all',
                       help='门店ID: newcentury/meilecheng/xingang/lafangsi/all')

    args = parser.parse_args()

    # 打印欢迎信息
    print("=" * 60)
    print("[ Pilates Analyzer ] v2.0 - 原始计算逻辑版")
    print("=" * 60)

    # 确定工作目录
    if args.project_path:
        project_path = Path(args.project_path)
    else:
        # 尝试寻找data-toolkit目录
        cwd = Path.cwd()
        if (cwd / 'data-toolkit').exists():
            project_path = cwd / 'data-toolkit'
        elif (cwd.name == 'data-toolkit'):
            project_path = cwd
        else:
            print("[!] 未找到 data-toolkit 目录，请使用 -p 指定项目路径")
            return 1

    print(f"[.] 工作目录: {project_path}")

    # 初始化分析器
    analyzer = PilatesAnalyzer(project_path)

    # 自动发现Excel文件（按照文件名包含门店中文名）
    data_dir = project_path / 'data'
    excel_files = {}
    store_name_mapping = {
        '新世纪': 'newcentury',
        '美乐城': 'meilecheng',
        '鑫港': 'xingang',
        '拉德芳斯': 'lafangsi'
    }

    if data_dir.exists():
        for excel_file in data_dir.glob('*.xlsx'):
            for name_ch, store_id in store_name_mapping.items():
                if name_ch in excel_file.name and ('~$' not in excel_file.name):
                    excel_files[store_id] = str(excel_file)
                    print(f"[+] 发现: {name_ch} → {excel_file.name}")
                    break

    if not excel_files:
        print("[!] 未发现任何Excel文件，请检查data目录")
        return 1

    # 读取指标录入表（如果有）
    indicators_dict = {}
    for store_id in excel_files.keys():
        indicators_file = data_dir / f'{store_id}_indicators.xlsx'
        if indicators_file.exists():
            indicators_dict[store_id] = read_indicators_sheet(str(indicators_file), store_id)
            print(f"[+] 指标录入表: {store_id}")

    # 执行分析
    print("\n[.] 执行数据分析...")
    result = analyzer.analyze_all_stores(excel_files, indicators_dict)

    print(f"\n[OK] 分析完成，共 {len(result['stores'])} 个门店:")
    for store in result['stores']:
        print(f"  - {store['name']}: 总耗课 {store['consumption']['lessons']} 节, "
              f"出勤 {store['consumption']['attendanceVolume']} 人, "
              f"人效 {store['humanEfficiency']} 节/人")

    # 生成JS数据文件（看板用）
    js_output_path = project_path / f'data/{args.month or "current"}_data.js'
    js_output_path.parent.mkdir(exist_ok=True)
    generate_js_output(result, str(js_output_path))
    print(f"\n[OK] JS数据文件已生成: {js_output_path}")

    # 生成可视化看板（如果需要）
    if args.action in ['dashboard', 'full']:
        print("\n[.] 生成可视化看板...")
        dashboard = DashboardGenerator(SKILL_DIR)
        output_path = dashboard.generate(
            {'result': result},  # 传给看板模板
            project_path / 'analysis_dashboard.html'
        )
        print(f"[OK] 看板已生成: {output_path}")
        print(f"[!] 请在浏览器中打开查看: file:///{output_path}")

    print("\n" + "=" * 60)
    return 0


if __name__ == '__main__':
    sys.exit(main())
