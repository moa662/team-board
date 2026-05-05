# 🚀 TeamBoard - Vercel 部署指南

## 第一步：准备 Supabase 数据库

1. 打开 [Supabase](https://supabase.com) 注册/登录
2. 点击 **New Project** 创建新项目
3. 填写项目信息，等待数据库创建完成（约 2 分钟）
4. 进入项目后，点击左侧 **SQL Editor**
5. 点击 **New Query**，复制 `setup.sql` 的全部内容粘贴进去
6. 点击 **Run** 执行建表

## 第二步：获取 Supabase 配置

1. 在 Supabase 项目中，点击左侧 **Settings** → **API**
2. 复制 **Project URL**（类似 `https://xxx.supabase.co`）
3. 复制 **anon public** key（很长的一串）

## 第三步：部署到 Vercel

### 方式 A：GitHub 仓库部署（推荐）

1. 把 `team-board` 文件夹推送到你的 GitHub 仓库
2. 打开 [Vercel](https://vercel.com)，用 GitHub 登录
3. 点击 **Add New** → **Project**
4. 导入你的仓库
5. **Framework Preset** 选 `Other`
6. **Root Directory** 填 `team-board`（如果在子目录）
7. 点击 **Deploy**

### 方式 B：直接上传文件夹

1. 打开 [Vercel](https://vercel.com) 登录
2. 点击 **Add New** → **Project**
3. 拖拽 `team-board` 文件夹到上传区域
4. 等待上传完成，自动部署

## 第四步：首次使用配置

1. 部署完成后，打开 Vercel 分配的域名
2. 在配置页面填写：
   - **Supabase URL**：第二步复制的 Project URL
   - **Supabase Anon Key**：第二步复制的 anon key
   - **你的昵称**：团队中显示的名字
3. 点击 **保存配置**，系统会自动创建默认项目

## ✅ 完成！

现在你可以：
- 📁 创建多个项目
- 📋 在每个项目中管理任务看板
- ➕ 创建任务、设置标签、指定负责人
- 🤝 分享 Vercel 链接给团队成员，输入同样的 Supabase 配置即可协作

## 📱 团队成员使用

团队成员打开同一个链接，填写相同的 Supabase URL 和 Key，设置自己的昵称，即可实时协作！

---

## 本地开发测试

直接双击 `index.html` 在浏览器打开，填写 Supabase 配置即可使用。
