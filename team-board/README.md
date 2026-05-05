# 🔀 Team Board

轻量级团队协作看板，类似 Trello。

## ✨ 功能特性

- 📋 **看板管理** - 多列拖拽，灵活布局
- 🎴 **任务卡片** - 标题、描述、负责人、标签、截止日期
- 🔄 **实时同步** - 多人协作，变更自动同步
- 🔐 **密码访问** - 简单密码保护，无需注册
- 📱 **响应式设计** - 完美适配手机
- 🎨 **暗黑科技风** - 紫色+青色渐变，玻璃拟态

## 🚀 快速开始

### 本地使用

直接双击 `index.html` 打开即可。

### 部署到 Vercel

1. Fork 这个仓库
2. 导入到 [Vercel](https://vercel.com)
3. 零配置，自动部署

## ⚙️ 首次配置

第一次打开会引导你配置 Supabase：

1. 注册 [Supabase](https://supabase.com)，创建新项目
2. 在 SQL Editor 中执行 `setup.sql`
3. 把 Project URL 和 Anon Key 粘贴到设置页
4. 设置团队访问密码

## 📁 项目结构

```
team-board/
├── index.html      # 单文件应用
├── setup.sql       # 数据库初始化脚本
└── README.md       # 说明文档
```

## 🛠️ 技术栈

- **原生 HTML/CSS/JS** - 零依赖，零构建
- **SortableJS** - 拖拽库
- **Supabase** - PostgreSQL + 实时订阅
- **Vercel** - 部署托管

## 🤝 WorkBuddy 对接（预留）

后面可以通过 API 层接入 WorkBuddy 智能体，实现：
- 自动创建任务
- 状态自动更新
- 评论同步
- 工作流自动化
