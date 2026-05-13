#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速添加日志条目
用法: python add_entry.py
交互式输入标题、内容、标签，自动追加到 JSON
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# 修复 Windows 控制台编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DATA_PATH = Path(__file__).parent / 'timeline-data.json'


def get_next_id(entries):
    """生成下一个可用的 ID"""
    max_num = 0
    for e in entries:
        e_id = e.get('id', '')
        if e_id.startswith('e') and e_id[1:].isdigit():
            max_num = max(max_num, int(e_id[1:]))
    return f'e{max_num + 1}'


def main():
    # 读取现有数据
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f'[ERROR] 找不到文件: {DATA_PATH}')
        return
    except json.JSONDecodeError as e:
        print(f'[ERROR] JSON 格式错误: {e}')
        return

    entries = data.get('entries', [])

    print('=' * 40)
    print('添加新日志条目')
    print('=' * 40)

    now = datetime.now()
    default_date = now.strftime('%Y-%m-%d')
    default_time = now.strftime('%H:%M')

    title = input('\n标题: ').strip()
    if not title:
        print('[ERROR] 标题不能为空')
        return

    content = input('内容 (可选，直接回车跳过): ').strip()

    tags_str = input('标签 (逗号分隔，可选): ').strip()
    tags = [t.strip() for t in tags_str.split(',')] if tags_str else []

    date = input(f'日期 (默认: {default_date}): ').strip() or default_date
    time = input(f'时间 (默认: {default_time}): ').strip() or default_time

    # 生成新条目
    new_entry = {
        'id': get_next_id(entries),
        'date': date,
        'time': time,
        'title': title
    }
    if content:
        new_entry['content'] = content
    if tags:
        new_entry['tags'] = tags

    # 确认
    print('\n' + '=' * 40)
    print('预览:')
    print(f'  日期: {date} {time}')
    print(f'  标题: {title}')
    if content:
        print(f'  内容: {content}')
    if tags:
        print(f'  标签: {", ".join(tags)}')
    print('=' * 40)

    confirm = input('\n确认添加? (Y/n): ').strip().lower()
    if confirm and confirm != 'y':
        print('已取消')
        return

    # 追加并保存
    entries.append(new_entry)
    data['entries'] = entries
    data['meta']['lastUpdated'] = default_date

    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print(f'\n[OK] 已添加! 共 {len(entries)} 条日志')


if __name__ == '__main__':
    main()
