#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
项目智能分析脚本
扫描所有日志，自动识别哪些条目属于同一个项目，打上项目标签
"""

import json
import sys
from collections import defaultdict
from pathlib import Path

# 修复 Windows 控制台编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DATA_PATH = Path(__file__).parent / 'timeline-data.json'

# 项目关键词词典 - 可以不断补充
PROJECT_KEYWORDS = {
    '时间轴项目': ['时间轴', 'timeline', '里程碑', '看板', '卡片', '折叠', '拖拽', '滚动', '筛选', '标签'],
    'AI开发': ['AI', 'Claude', 'GPT', '模型', 'prompt', '提示词', '语音', 'Whisper'],
    '产品设计': ['产品', '需求', '交互', '设计', '原型', '用户体验', 'UI'],
    '知识库': ['Obsidian', '笔记', 'wiki', '知识库', '文档', '同步'],
    '短视频运营': ['视频', '剪辑', '脚本', '拍摄', '抖音', 'B站', '运营'],
}

# 停用词（不构成项目特征）
STOP_WORDS = {'的', '了', '是', '在', '我', '有', '和', '就', '都', '也', '要', '会', '可以', '一下', '这个', '那个'}


def extract_words(text):
    """简单分词，提取关键词"""
    words = []
    # 按标点和空格分割
    import re
    tokens = re.split(r'[，。、；\s\n]+', text)
    for t in tokens:
        if t and t not in STOP_WORDS and len(t) >= 2:
            words.append(t)
    return words


def classify_project(entry):
    """根据标题和内容判断属于哪个项目"""
    text = entry.get('title', '') + ' ' + entry.get('content', '')
    text = text.lower()

    scores = defaultdict(int)
    words = extract_words(text)

    # 匹配关键词词典
    for project, keywords in PROJECT_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                scores[project] += 1
        for word in words:
            if word in keywords:
                scores[project] += 1

    # 也检查现有标签
    for tag in entry.get('tags', []):
        for project, keywords in PROJECT_KEYWORDS.items():
            if tag in keywords:
                scores[project] += 2

    if scores:
        return max(scores.items(), key=lambda x: x[1])[0]
    return None


def analyze_projects():
    """分析所有条目，自动打项目标签"""
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    entries = data.get('entries', [])
    project_counts = defaultdict(int)
    updated = 0

    print('=' * 50)
    print('🔍 项目智能分析')
    print('=' * 50)
    print(f'共 {len(entries)} 条日志\n')

    for entry in entries:
        project = classify_project(entry)

        if project:
            tags = entry.get('tags', [])
            if project not in tags:
                tags.append(project)
                entry['tags'] = tags
                project_counts[project] += 1
                updated += 1
                print(f'[+] {entry["date"]} | {entry["title"][:20]:<20} → {project}')

    print('\n' + '=' * 50)
    print('📊 分析结果:')
    for project, count in sorted(project_counts.items(), key=lambda x: -x[1]):
        print(f'   {project}: {count} 条')

    if updated > 0:
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f'\n[OK] 已更新 {updated} 条日志的项目标签')
    else:
        print('\n所有日志都已分类完成 ✅')


if __name__ == '__main__':
    analyze_projects()
