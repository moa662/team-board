#!/usr/bin/env python3
"""
Wiki 待办一键同步脚本
用法: python sync_wiki_todos.py

功能:
1. 扫描 my-wiki 目录下所有待办
2. 输出到 team-board/wiki_todos.json
3. 浏览器刷新页面自动加载
"""
import os
import re
import json
from pathlib import Path

WIKI_PATH = Path(__file__).parent.parent.parent / 'my-wiki'
OUTPUT_PATH = Path(__file__).parent.parent / 'wiki_todos.json'


def scan_wiki_todos():
    """扫描 wiki 目录，提取所有待办"""
    todos = []
    todo_id = 1

    for root, dirs, files in os.walk(WIKI_PATH):
        for file in files:
            if not (file.endswith('.md') or file.endswith('.html') or file.endswith('.py')):
                continue

            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, WIKI_PATH)

            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except:
                continue

            # 提取 markdown 待办：- [ ] xxx
            md_pattern = r'-\s\[\s\]\s(.+)'
            for match in re.finditer(md_pattern, content):
                todo_text = match.group(1).strip()
                if len(todo_text) > 3 and len(todo_text) < 200:
                    todos.append({
                        'id': str(todo_id),
                        'title': todo_text,
                        'source_file': rel_path,
                        'source': 'wiki',
                        'due_date': None,
                        'priority': 'medium'
                    })
                    todo_id += 1

    # 去重
    seen = set()
    unique_todos = []
    for t in todos:
        if t['title'] not in seen:
            seen.add(t['title'])
            unique_todos.append(t)

    return unique_todos


if __name__ == '__main__':
    print('=' * 50)
    print('📋 Wiki 待办同步器')
    print('=' * 50)

    todos = scan_wiki_todos()

    # 输出 JSON
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(todos, f, ensure_ascii=False, indent=2)

    print(f'\n✅ 扫描完成！')
    print(f'📝 共提取 {len(todos)} 条待办（已去重）')
    print(f'📁 输出文件: {OUTPUT_PATH}')
    print(f'\n前 {min(5, len(todos))} 条：')
    for t in todos[:5]:
        print(f'  - {t["title"][:60]}')

    print('\n' + '=' * 50)
    print('💡 下一步：')
    print('   1. 刷新 TeamBoard 页面')
    print('   2. 待办事项自动加载完成！')
    print('=' * 50)
