#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
单文件 Markdown 日志同步脚本

在 我的日志.md 里这样写:
---
2026-05-11 09:30
和 Claude 讨论时间轴功能
内容：聊了拖拽滚动、标签筛选、Obsidian 同步的方案
标签：思考,产品

---
2026-05-11 14:00
搞定了拖拽滚动
标签：开发
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

# 你的日志文件路径 - 可以修改为你喜欢的位置
LOG_FILE = Path(__file__).parent / '我的日志.md'
DATA_PATH = Path(__file__).parent / 'timeline-data.json'

# 条目分隔符
ENTRY_SEPARATOR = '---'


def get_next_id(entries):
    """生成下一个可用的 ID"""
    max_num = 0
    for e in entries:
        e_id = e.get('id', '')
        if e_id.startswith('e') and e_id[1:].isdigit():
            max_num = max(max_num, int(e_id[1:]))
    return f'e{max_num + 1}'


def parse_entry(block):
    """解析一个日志块"""
    lines = [l.strip() for l in block.strip().split('\n') if l.strip()]
    if not lines:
        return None

    # 第一行: 日期 + 时间
    first_line = lines[0]
    # 匹配: 2026-05-11 09:30 或 2026-05-11
    date_match = re.match(r'(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}))?', first_line)
    if not date_match:
        return None

    date = date_match.group(1)
    time = date_match.group(2) or '00:00'

    # 第二行: 标题
    title = lines[1] if len(lines) > 1 else f'日志 {date}'

    # 剩余行: 内容 + 标签
    content = ''
    tags = []
    for line in lines[2:]:
        if line.startswith('标签：') or line.startswith('标签:'):
            tag_str = line.replace('标签：', '').replace('标签:', '').strip()
            tags = [t.strip() for t in tag_str.split(',') if t.strip()]
        elif line.startswith('内容：') or line.startswith('内容:'):
            content = line.replace('内容：', '').replace('内容:', '').strip()
        else:
            content += ('\n' if content else '') + line

    return {
        'date': date,
        'time': time,
        'title': title,
        'content': content.strip(),
        'tags': tags
    }


def sync_markdown():
    """同步 Markdown 日志到 JSON"""
    if not LOG_FILE.exists():
        print(f'[INFO] 日志文件不存在，已创建模板: {LOG_FILE.name}')
        template = """---
2026-05-11 09:30
在这里写日志标题
内容：可以在这里写详细内容，也可以省略
标签：思考,产品

---
2026-05-11 14:00
第二条日志的标题
标签：开发
"""
        with open(LOG_FILE, 'w', encoding='utf-8') as f:
            f.write(template)
        return

    # 读取 Markdown
    with open(LOG_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # 读取现有 JSON 数据
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f'[ERROR] 读取数据失败: {e}')
        return False

    entries = data.get('entries', [])
    existing_keys = {(e.get('date', ''), e.get('title', '')) for e in entries}

    # 分割并解析条目
    blocks = content.split(ENTRY_SEPARATOR)
    new_count = 0
    skipped = 0

    for block in blocks:
        entry = parse_entry(block)
        if not entry:
            continue

        # 去重（日期 + 标题 作为唯一键）
        key = (entry['date'], entry['title'])
        if key in existing_keys:
            skipped += 1
            continue

        # 构建新条目
        new_entry = {
            'id': get_next_id(entries),
            'date': entry['date'],
            'time': entry['time'],
            'title': entry['title']
        }
        if entry['content']:
            new_entry['content'] = entry['content']
        if entry['tags']:
            new_entry['tags'] = entry['tags']

        entries.append(new_entry)
        existing_keys.add(key)
        new_count += 1
        print(f'[+] {entry["date"]} {entry["time"]} | {entry["title"]}')

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
    print('Markdown 日志同步工具')
    print('=' * 50)
    print(f'日志文件: {LOG_FILE.name}\n')
    sync_markdown()


if __name__ == '__main__':
    main()
