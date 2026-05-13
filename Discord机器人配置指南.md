# Discord 知识库机器人配置指南

## 📋 功能介绍

手机/电脑上用Discord给机器人发消息，自动调用Claude整理，直接更新到GitHub知识库。

## 🚀 5步配置完成

### 第1步：创建Discord机器人

1. 打开 https://discord.com/developers/applications
2. 点击 "New Application"，命名（比如"知识库助手"）
3. 到 "Bot" 页面，点击 "Add Bot"
4. 点击 "Reset Token"，**保存这个TOKEN**（后面要用）
5. 开启 "Message Content Intent" 开关
6. 到 "OAuth2 → URL Generator"
   - 勾选 `bot` 和 `applications.commands`
   - 勾选权限：`Send Messages`, `Embed Links`, `Read Message History`
7. 复制生成的URL，在浏览器打开，邀请机器人到你的服务器

### 第2步：获取公钥

1. 在 "General Information" 页面
2. 复制 "Public Key"，保存下来

### 第3步：配置环境变量

在Vercel项目的 Settings → Environment Variables 中添加：

```env
DISCORD_PUBLIC_KEY=你的公钥
DISCORD_BOT_TOKEN=你的Bot Token
ANTHROPIC_API_KEY=你的Claude API Key
GITHUB_TOKEN=你的GitHub Personal Access Token
GITHUB_REPO=你的用户名/仓库名（比如 Mao/my-wiki）
```

### 第4步：部署到Vercel

```bash
vercel deploy
```

部署后，把Vercel地址填回到Discord开发者后台：
- "Interactions Endpoint URL" 填：`https://你的域名.vercel.app/api/discord-bot`

### 第5步：注册Slash命令

创建一个临时脚本注册命令，或者用Postman发送：

```javascript
// 注册命令
const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'chat',
    description: '跟Claude聊天',
    options: [{
      name: 'message',
      type: 3,
      description: '你想说的话',
      required: true
    }]
  },
  {
    name: 'note',
    description: '保存笔记到知识库',
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
          { name: 'AI技术', value: 'AI技术' },
          { name: '商业经营', value: '商业经营' },
          { name: '个人成长', value: '个人成长' },
          { name: '其他', value: '其他' }
        ]
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
await rest.put(Routes.applicationCommands(APP_ID), { body: commands });
```

## 📱 使用方式

### 手机上：
1. 打开Discord APP
2. 进入你的服务器
3. 输入 `/chat 今天我学到了一个很重要的运营方法...`
4. 或者 `/note 今天的想法... 分类:商业经营`

### 机器人会：
- ✅ 调用Claude 3.5整理内容
- ✅ 自动分类、生成摘要
- ✅ 直接提交到GitHub
- ✅ 你的Obsidian会自动同步拉取

## 🔧 扩展功能（可选）

可以轻松添加：
- 🎤 语音消息转文字（OpenAI Whisper）
- 📸 图片内容识别（Claude Vision）
- 🔔 新笔记提醒到你的私信
- 📊 知识库统计
- 🔍 搜索知识库内容

## 💡 使用技巧

1. **随手记录灵感**：想到什么直接 `/note 内容`，机器人帮你整理
2. **语音转文字**：手机Discord发语音，机器人可以自动转文字并整理
3. **群聊协作**：把机器人拉到群里，大家一起维护知识库
4. **快捷回复**：Discord支持快捷指令，一键保存

---

需要我帮你写注册命令的脚本，或者配置其他功能，随时说！
