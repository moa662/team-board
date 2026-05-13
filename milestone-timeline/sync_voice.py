#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
语音输入同步脚本

把录音文件（m4a/mp3/wav）放到「语音输入」文件夹里，运行本脚本：
1. Whisper 自动转文字
2. LLM 智能提取：日期、时间、标题、内容、标签
3. 自动写入 timeline-data.json
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

# 配置
VOICE_FOLDER = Path(__file__).parent / '语音输入'
DATA_PATH = Path(__file__).parent / 'timeline-data.json'

# OpenAI 配置 - 可选：
# 方式1: 设置环境变量 OPENAI_API_KEY
# 方式2: 直接写在这里（不推荐提交到代码库）
OPENAI_API_KEY = ''

# 使用方式：
# - 'openai': 用 OpenAI Whisper API + GPT 解析（需要 Key）
# - 'local': 用本地 Whisper + 本地 LLM 解析（需要 ffmpeg + 模型）
# - 'manual': 只转文字，手动填写（不需要 Key）
MODE = 'manual'  # 默认先用手动模式体验


def get_next_id(entries):
    """生成下一个可用的 ID"""
    max_num = 0
    for e in entries:
        e_id = e.get('id', '')
        if e_id.startswith('e') and e_id[1:].isdigit():
            max_num = max(max_num, int(e_id[1:]))
    return f'e{max_num + 1}'


def transcribe_audio(audio_file):
    """语音转文字（手动模式下直接返回文件名）"""
    if MODE == 'manual':
        print(f'[!] 手动模式，请输入【{audio_file.name}】的内容：')
        print('    （按 Ctrl+Z + 回车 结束，或直接粘贴多行）')
        lines = []
        try:
            while True:
                lines.append(input())
        except EOFError:
            pass
        text = '\n'.join(lines).strip()
        if not text:
            print('    跳过空内容')
            return None
        return text

    # TODO: OpenAI / 本地 Whisper 实现
    print(f'[!] {MODE} 模式还没实现，先用手动')
    return None


def parse_entry_with_llm(text):
    """用 LLM 解析文字，提取结构化信息"""
    if MODE == 'manual':
        # 手动模式：简单解析 + 交互式确认
        now = datetime.now()
        default_date = now.strftime('%Y-%m-%d')
        default_time = now.strftime('%H:%M')

        print(f'\n📝 识别到内容：')
        print(f'    {text[:100]}...' if len(text) > 100 else f'    {text}')
        print()

        title = input('标题 (直接回车用前20字): ').strip()
        if not title:
            title = text[:20].replace('\n', ' ')

        date = input(f'日期 (默认: {default_date}): ').strip() or default_date
        time = input(f'时间 (默认: {default_time}): ').strip() or default_time
        content = input('内容详情 (可选): ').strip()
        tags_str = input('标签 (逗号分隔，可选): ').strip()
        tags = [t.strip() for t in tags_str.split(',') if t.strip()]

        return {
            'date': date,
            'time': time,
            'title': title,
            'content': content,
            'tags': tags
        }

    # TODO: LLM 智能解析实现
    return None


def sync_voice():
    """同步语音文件夹中的录音"""
    if not VOICE_FOLDER.exists():
        VOICE_FOLDER.mkdir()
        print(f'[INFO] 已创建文件夹: {VOICE_FOLDER.name}')

    audio_files = []
    for ext in ['*.m4a', '*.mp3', '*.wav', '*.flac']:
        audio_files.extend(VOICE_FOLDER.glob(ext))

    if not audio_files:
        print(f'[INFO] {VOICE_FOLDER.name} 文件夹中没有找到录音文件')
        print('       把录音文件放进去再运行试试')
        return

    print(f'找到 {len(audio_files)} 个录音文件\n')

    # 读取现有数据
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f'[ERROR] 读取数据失败: {e}')
        return False

    entries = data.get('entries', [])
    processed_count = 0

    for audio_file in sorted(audio_files):
        print('=' * 50)
        print(f'处理: {audio_file.name}')
        print('=' * 50)

        # 转文字
        text = transcribe_audio(audio_file)
        if not text:
            continue

        # 解析结构化信息
        entry = parse_entry_with_llm(text)
        if not entry:
            continue

        # 添加到 JSON
        new_entry = {
            'id': get_next_id(entries),
            'date': entry['date'],
            'time': entry['time'],
            'title': entry['title']
        }
        if entry.get('content'):
            new_entry['content'] = entry['content']
        if entry.get('tags'):
            new_entry['tags'] = entry['tags']

        entries.append(new_entry)
        processed_count += 1

        print(f'\n[OK] 已添加: {entry["date"]} {entry["time"]} | {entry["title"]}')

        # 移动到已处理文件夹
        processed_folder = VOICE_FOLDER / '已处理'
        processed_folder.mkdir(exist_ok=True)
        audio_file.rename(processed_folder / audio_file.name)
        print(f'     已移动到: 已处理/{audio_file.name}\n')

    # 保存
    if processed_count > 0:
        data['entries'] = entries
        data['meta']['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        print(f'\n完成! 处理了 {processed_count} 条语音')
        print(f'当前共 {len(entries)} 条日志')


def main():
    print('=' * 50)
    print('🎤 语音输入同步工具')
    print('=' * 50)
    print(f'模式: {MODE}')
    print()
    sync_voice()


if __name__ == '__main__':
    main()
