#!/usr/bin/env python3
"""
Wiki 待办扫描器
扫描 my-wiki 目录下所有 markdown 和 HTML 文件，提取待办事项
输出 JSON 格式，可以直接导入 TeamBoard
"""
import os
import re
import json
from pathlib import Path

def scan_wiki_todos(wiki_path="../my-wiki"):
    """扫描 wiki 目录，提取所有待办"""
    todos = []
    todo_id = 1

    for root, dirs, files in os.walk(wiki_path):
        for file in files:
            if not (file.endswith('.md') or file.endswith('.html')):
                continue

            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, wiki_path)

            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except:
                continue

            # 1. 提取 markdown 待办：- [ ] xxx
            md_pattern = r'-\s\[\s\]\s(.+)'
            for match in re.finditer(md_pattern, content):
                todo_text = match.group(1).strip()
                if len(todo_text) > 5 and len(todo_text) < 200:
                    todos.append({
                        'id': str(todo_id),
                        'title': todo_text,
                        'source_file': rel_path,
                        'source': 'wiki',
                        'due_date': None,
                        'priority': 'medium'
                    })
                    todo_id += 1

            # 2. 提取 HTML 待办区块
            if file.endswith('.html'):
                # 找 <h3>📋 待办事项</h3> 后面的列表
                todo_block_pattern = r'<h[34]>.*待办事项.*?</h[34]>(.*?)<(?:h[1-4]|/div|/body)>'
                for block_match in re.finditer(todo_block_pattern, content, re.DOTALL):
                    block = block_match.group(1)
                    # 提取列表项
                    li_pattern = r'<li[^>]*>(.+?)</li>'
                    for li_match in re.finditer(li_pattern, block, re.DOTALL):
                        todo_text = re.sub(r'<[^>]+>', '', li_match.group(1)).strip()
                        if len(todo_text) > 5 and len(todo_text) < 200:
                            todos.append({
                                'id': str(todo_id),
                                'title': todo_text,
                                'source_file': rel_path,
                                'source': 'wiki',
                                'due_date': None,
                                'priority': 'medium'
                            })
                            todo_id += 1

    return todos

if __name__ == '__main__':
    todos = scan_wiki_todos()

    # 输出 JSON
    output_file = 'wiki_todos.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(todos, f, ensure_ascii=False, indent=2)

    print(f'[OK] Scan complete!')
    print(f'Found {len(todos)} todos')
    print(f'Output: {output_file}')
    print()
    print('First 5:')
    for t in todos[:5]:
        print(f'  - {t["title"][:50]}...')
    print()
    print('[Tip] Copy the JSON below and paste into TeamBoard:')
    print(json.dumps(todos, ensure_ascii=False))
