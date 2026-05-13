#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Obsidian 日志同步脚本
扫描指定文件夹中的 Markdown 文件，提取日志条目并追加到 JSON
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

# 修复 Windows 控制台编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 配置 - 修改这里为你的 Obsidian 日志文件夹路径
# 例如: OBSIDIAN_FOLDER = Path('C:/Users/xxx/Documents/Obsidian/日志')
OBSIDIAN_FOLDER = None  # 请修改这里！

DATA_PATH = Path(__file__).parent / 'timeline-data.json'

# 文件名日期格式匹配，支持:
# - 2025-05-09 标题.md
# - 20250509-标题.md
# - 2025-05-09.md
DATE_PATTERNS = [
    re.compile(r'^(\d{4}-\d{2}-\d{2})'),
    re.compile(r'^(\d{8})'),
]

# 标签提取: [[标签]] 或 #标签
TAG_PATTERNS = [
    re.compile(r'\[\[([^\]]+)\]\]'),
    re.compile(r'#(\w+)'),
]


def parse_date_from_filename(filename):
    """从文件名中提取日期"""
    for pattern in DATE_PATTERNS:
        m = pattern.search(filename)
        if m:
            date_str = m.group(1)
            if len(date_str) == 8:  # YYYYMMDD
                try:
                    return f'{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}'
                except:
                    pass
            return date_str
    return None


def extract_tags(content):
    """从内容中提取标签"""
    tags = set()
    for pattern in TAG_PATTERNS:
        for m in pattern.finditer(content):
            tags.add(m.group(1))
    return sorted(tags)


def get_next_id(entries):
    """生成下一个可用的 ID"""
    max_num = 0
    for e in entries:
        e_id = e.get('id', '')
        if e_id.startswith('e') and e_id[1:].isdigit():
            max_num = max(max_num, int(e_id[1:]))
    return f'e{max_num + 1}'


def sync_folder(folder_path):
    """同步文件夹中的所有 Markdown 文件"""
    folder = Path(folder_path)
    if not folder.exists():
        print(f'[ERROR] 文件夹不存在: {folder}')
        return False

    # 读取现有数据
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f'[ERROR] 读取数据失败: {e}')
        return False

    entries = data.get('entries', [])
    existing_titles = {e.get('title', '') for e in entries}

    new_count = 0
    skipped = 0

    # 扫描 Markdown 文件
    for md_file in sorted(folder.glob('**/*.md')):
        filename = md_file.stem

        # 提取日期
        date = parse_date_from_filename(filename)
        if not date:
            continue

        # 读取内容
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read().strip()
        except Exception as e:
            print(f'[WARN] 读取失败 {md_file.name}: {e}')
            continue

        # 标题 = 文件名去掉日期部分
        title = filename
        for pattern in DATE_PATTERNS:
            title = pattern.sub('', title).strip()
            title = title.lstrip(' -_')
        if not title:
            title = f'日志 {date}'

        # 去重
        if title in existing_titles:
            skipped += 1
            continue

        # 提取标签
        tags = extract_tags(content)

        # 生成新条目
        new_entry = {
            'id': get_next_id(entries),
            'date': date,
            'time': '00:00',
            'title': title
        }
        if content:
            # 内容只保留前 200 字符
            new_entry['content'] = content[:200] + ('...' if len(content) > 200 else '')
        if tags:
            new_entry['tags'] = tags

        entries.append(new_entry)
        existing_titles.add(title)
        new_count += 1
        print(f'[+] {date} | {title}')

    # 保存
    if new_count > 0:
        data['entries'] = entries
        data['meta']['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

    print(f'\n完成! 新增 {new_count} 条, 跳过 {skipped} 条重复')
    print(f'当前共 {len(entries)} 条日志')
    return True


def main():
    print('=' * 50)
    print('Obsidian 日志同步工具')
    print('=' * 50)

    if not OBSIDIAN_FOLDER:
        print('\n[ERROR] 请先配置 Obsidian 文件夹路径!')
        print('编辑 sync_obsidian.py，修改 OBSIDIAN_FOLDER 变量')
        print('例如: OBSIDIAN_FOLDER = Path(\"C:/Users/xxx/Documents/Obsidian/日志\")')
        return

    print(f'\n扫描文件夹: {OBSIDIAN_FOLDER}\n')
    sync_folder(OBSIDIAN_FOLDER)


if __name__ == '__main__':
    main()
