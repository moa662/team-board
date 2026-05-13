#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
时间轴构建脚本
用法: python build.py [--watch]
功能: 将 timeline-data.json 和 index.template.html 合并生成最终的 index.html
"""

import json
import sys
import time
from pathlib import Path

# 修复 Windows 控制台编码问题
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def build():
    """构建最终的 HTML 文件"""
    base_path = Path(__file__).parent
    template_path = base_path / 'index.template.html'
    data_path = base_path / 'timeline-data.json'
    output_path = base_path / 'index.html'

    # 读取模板
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template = f.read()
    except FileNotFoundError:
        print(f'[ERROR] 找不到模板文件 {template_path}')
        return False

    # 读取数据
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f'[ERROR] 找不到数据文件 {data_path}')
        return False
    except json.JSONDecodeError as e:
        print(f'[ERROR] JSON 格式错误: {e}')
        return False

    # 将数据转为 JS 代码（美化格式，方便调试）
    data_js = json.dumps(data, ensure_ascii=False, indent=2)

    # 替换占位符
    final_html = template.replace('{{TIMELINE_DATA}}', data_js)

    # 写入最终文件
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_html)

    print(f'[OK] 构建成功！输出文件: {output_path}')
    print(f'     包含 {len(data.get("milestones", []))} 个里程碑')
    print(f'     包含 {len(data.get("entries", []))} 条日志')
    return True


def watch():
    """监视文件变化，自动重新构建"""
    base_path = Path(__file__).parent
    data_path = base_path / 'timeline-data.json'

    print('[INFO] 监视模式已启动，修改 timeline-data.json 后自动重新构建...')
    print('[INFO] 按 Ctrl+C 退出\n')

    last_mtime = 0

    try:
        while True:
            current_mtime = data_path.stat().st_mtime
            if current_mtime != last_mtime:
                last_mtime = current_mtime
                print('[INFO] 检测到数据文件变化，重新构建...')
                build()
                print('')
            time.sleep(1)
    except KeyboardInterrupt:
        print('\n[INFO] 已退出监视模式')


if __name__ == '__main__':
    if '--watch' in sys.argv or '-w' in sys.argv:
        watch()
    else:
        build()
