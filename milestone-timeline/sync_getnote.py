#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Get笔记 同步到时间轴脚本
从 Get笔记 API 拉取最新笔记，自动分析项目后写入 timeline-data.json
"""

import os
import sys
import json
import re
from datetime import datetime
from pathlib import Path

# 修复 Windows 控制台编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import requests
from dotenv import load_dotenv

# 加载环境变量（从 my-wiki/scripts/.env）
ENV_PATH = Path(r'E:\AI\cluadecodeworkspace\my-wiki\scripts\.env')
load_dotenv(ENV_PATH)

API_KEY = os.getenv('GETNOTE_API_KEY')
CLIENT_ID = os.getenv('GETNOTE_CLIENT_ID')

# 目录配置
DATA_PATH = Path(__file__).parent / 'timeline-data.json'

# API 配置
BASE_URL = 'https://openapi.biji.com'
LIST_API = f'{BASE_URL}/open/api/v1/resource/note/list'

# 项目关键词词典（和 analyze_projects.py 保持一致）
PROJECT_KEYWORDS = {
    '时间轴项目': ['时间轴', 'timeline', '里程碑', '看板', '卡片', '折叠', '拖拽', '滚动', '筛选', '标签'],
    'AI开发': ['AI', 'Claude', 'GPT', '模型', 'prompt', '提示词', '语音', 'Whisper', 'agent', '智能体'],
    '产品设计': ['产品', '需求', '交互', '设计', '原型', '用户体验', 'UI'],
    '知识库': ['Obsidian', '笔记', 'wiki', '知识库', '文档', '同步', 'Get笔记', 'getnote'],
    '短视频运营': ['视频', '剪辑', '脚本', '拍摄', '抖音', 'B站', '运营', '短视频'],
    '商业经营': ['健身', '普拉提', '门店', '运营', 'ip', '营销', '流量', '创业', '管理', '获客'],
}


def get_headers():
    """生成请求头"""
    return {
        'Authorization': API_KEY,
        'X-Client-ID': CLIENT_ID,
        'Content-Type': 'application/json',
    }


def fetch_notes(cursor='0'):
    """获取笔记列表"""
    params = {}
    if cursor and cursor != '0':
        params['cursor'] = cursor

    try:
        response = requests.get(LIST_API, headers=get_headers(), params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        if data.get('success'):
            return data['data']
        else:
            print(f'API 错误: {data.get("error")}')
            return None
    except Exception as e:
        print(f'请求失败: {e}')
        return None


def detect_project(title, content):
    """智能识别属于哪个项目"""
    text = (title + ' ' + content).lower()
    scores = {}

    for project, keywords in PROJECT_KEYWORDS.items():
        scores[project] = 0
        for kw in keywords:
            if kw in text:
                scores[project] += 1

    max_score = max(scores.values()) if scores else 0
    if max_score > 0:
        return max(scores.items(), key=lambda x: x[1])[0]
    return None


def get_next_id(entries):
    """生成下一个可用的 ID"""
    max_num = 0
    for e in entries:
        e_id = e.get('id', '')
        if e_id.startswith('e') and e_id[1:].isdigit():
            max_num = max(max_num, int(e_id[1:]))
    return f'e{max_num + 1}'


def extract_plain_text(content):
    """从HTML/Markdown提取纯文本内容"""
    # 移除图片
    text = re.sub(r'!\[.*?\]\(https?://.*?\)', '[图片]', content)
    # 移除链接
    text = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', text)
    # 移除HTML标签
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()


def sync_getnote_to_timeline(limit=20):
    """同步 Get笔记 到时间轴"""
    print('=' * 60)
    print('📝 Get笔记 → 时间轴 同步工具')
    print('=' * 60)

    if not API_KEY or not CLIENT_ID:
        print(f'[ERROR] 未找到 API 配置')
        print(f'        配置文件: {ENV_PATH}')
        return 1

    print(f'[OK] 配置加载完成')
    print(f'   Client ID: {CLIENT_ID[:10]}...')
    print(f'   API Key:   {API_KEY[:15]}...\n')

    # 1. 获取笔记
    print('[FETCH] 正在获取 Get笔记...')
    data = fetch_notes()
    if not data:
        print('获取笔记失败')
        return 1

    notes = data.get('notes', [])
    print(f'   本次获取: {len(notes)} 条笔记\n')

    # 2. 读取现有时间轴数据
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        timeline_data = json.load(f)
    entries = timeline_data.get('entries', [])
    existing_titles = {e.get('title', '') for e in entries}

    # 3. 处理每条笔记
    new_count = 0
    skipped = 0

    print('=' * 60)
    print('📋 识别结果:')
    print('=' * 60)

    for note in notes:
        title = note.get('title', '').strip()
        content = note.get('content', '')
        created_at = note.get('created_at', '')

        if not title:
            title = content[:50].strip()
            if len(title) == 50:
                title += '...'

        # 去重
        if title in existing_titles:
            skipped += 1
            continue

        # 提取纯文本内容
        plain_content = extract_plain_text(content)

        # 智能识别项目
        project = detect_project(title, plain_content)

        # 解析日期
        date_str = created_at[:10] if created_at else str(datetime.now().date())
        time_str = created_at[11:16] if created_at else '00:00'

        # 提取标签
        tags = []
        for tag in note.get('tags', []):
            tags.append(tag.get('name', ''))
        if project:
            tags.append(project)

        # 构建条目
        new_entry = {
            'id': get_next_id(entries),
            'date': date_str,
            'time': time_str,
            'title': title,
        }
        if plain_content:
            new_entry['content'] = plain_content[:200] + ('...' if len(plain_content) > 200 else '')
        if tags:
            new_entry['tags'] = list(set(tags))  # 去重

        entries.append(new_entry)
        existing_titles.add(title)
        new_count += 1

        project_tag = f'[{project}]' if project else '[未分类]'
        print(f'  {project_tag:<12} {date_str} | {title[:40]}')

    # 4. 保存
    if new_count > 0:
        timeline_data['entries'] = entries
        timeline_data['meta']['lastUpdated'] = str(datetime.now().date())
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(timeline_data, f, ensure_ascii=False, indent=4)

        print(f'\n[OK] 同步完成！')
        print(f'   新增: {new_count} 条')
        print(f'   跳过重复: {skipped} 条')
        print(f'   总条目: {len(entries)} 条')
    else:
        print(f'\n[INFO] 没有新笔记需要同步 (跳过 {skipped} 条重复)')

    return 0


if __name__ == '__main__':
    sys.exit(sync_getnote_to_timeline())
