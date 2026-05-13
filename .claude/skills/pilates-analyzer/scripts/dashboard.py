#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
可视化看板生成器
"""
import json
from pathlib import Path


class DashboardGenerator:
    """看板生成器"""

    def __init__(self, skill_dir: Path):
        self.skill_dir = skill_dir
        self.template_path = skill_dir / 'templates' / 'dashboard.html'

    def generate(self, data: dict, output_path: Path) -> str:
        """生成HTML看板"""
        # 读取模板
        with open(self.template_path, 'r', encoding='utf-8') as f:
            template = f.read()

        # 准备注入数据
        data_json = json.dumps(data, ensure_ascii=False)

        # 替换模板变量
        html = template.replace('{{ANALYSIS_DATA}}', data_json)
        html = html.replace('{{GENERATE_TIME}}', data.get('generate_time', ''))

        # 写入输出
        output_path.parent.mkdir(exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)

        return str(output_path)
