#!/usr/bin/env node
/**
 * Discord Slash命令注册脚本
 * 用法：node scripts/register-discord-commands.js
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 从根目录 .env 加载配置
const envPath = path.join(__dirname, '..', '.env');
let envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) {
      envVars[key.trim()] = val.join('=').trim();
    }
  });
}

const DISCORD_BOT_TOKEN = envVars.DISCORD_BOT_TOKEN || '你的Bot Token';
const APPLICATION_ID = envVars.DISCORD_APP_ID || '你的Application ID';

// 命令定义
const commands = [
  {
    name: 'chat',
    description: '🤖 跟Claude聊天',
    options: [
      {
        name: 'message',
        type: 3,
        description: '你想说的话',
        required: true
      }
    ]
  },
  {
    name: 'note',
    description: '📝 保存笔记到知识库',
    options: [
      {
        name: 'content',
        type: 3,
        description: '笔记内容',
        required: true
      },
      {
        name: 'category',
        type: 3,
        description: '分类（可选）',
        required: false,
        choices: [
          { name: '🤖 AI技术', value: 'AI技术' },
          { name: '💼 商业经营', value: '商业经营' },
          { name: '🌱 个人成长', value: '个人成长' },
          { name: '📦 其他', value: '其他' }
        ]
      }
    ]
  },
  {
    name: 'help',
    description: '❓ 查看帮助'
  }
];

async function registerCommands() {
  if (DISCORD_BOT_TOKEN === '你的Bot Token') {
    console.log('❌ 请先配置 DISCORD_BOT_TOKEN 和 DISCORD_APP_ID 环境变量');
    console.log('');
    console.log('获取方式：');
    console.log('1. 打开 https://discord.com/developers/applications');
    console.log('2. 选择你的应用');
    console.log('3. General Information → Application ID');
    console.log('4. Bot → Reset Token 获取 Bot Token');
    return;
  }

  console.log('🚀 正在注册命令...');

  try {
    const response = await fetch(
      `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commands)
      }
    );

    if (response.ok) {
      console.log('✅ 命令注册成功！');
      console.log('');
      console.log('可用命令：');
      commands.forEach(cmd => {
        console.log(`  /${cmd.name} - ${cmd.description}`);
      });
      console.log('');
      console.log('💡 重启Discord客户端即可看到新命令');
    } else {
      const error = await response.json();
      console.log('❌ 注册失败:', error);
    }
  } catch (error) {
    console.log('❌ 出错了:', error.message);
  }
}

registerCommands();
