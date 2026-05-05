# 💬 TeamBoard 对话记录

> 按时间倒序，记录关键问答。只记有价值的，不记废话。

---

## 2024-05-05

**问**：上下文要爆了，写一个项目日志，每次继续开发前同步更新，每天结束也更新
**答**：创建了 `DEVLOG.md`，按时间倒序记录开发进度、完成内容、下一步计划、已知问题。约定每次开发前先看这个日志。

---

**问**：推上去，GitHub 和 Vercel 有限制吗？
**答**：没有限制。GitHub 免费版随便推，Vercel Hobby 版每月 100GB 带宽无限部署，Supabase Free 500MB 数据库，完全够用。推送成功。

---

**问**：你在本地打开我看看
**答**：启动了本地服务器 `python -m http.server 8080`，打开 http://localhost:8080/index.html 就能看仪表盘效果。

---

**问**：信息流这个我觉得好像没啥意义
**答**：对，小团队不需要看谁几点点了什么。砍掉信息流，改成：
- 仪表盘首页：项目总览卡片 + 我的待办 + 快捷工作台 + 本周到期
- 看板变成二级页面
- 预留数据源插件架构（以后接 GitHub/飞书/Jira）

---

**问**：我怎么配置？（Supabase RLS 报错）
**答**：在 Supabase SQL Editor 执行 5 条 SQL 关掉 RLS。推送代码到 master 分支（之前推到 main 了，Vercel 部署的是 master）。

---

**问**：显示 Ready 但是页面不是最新版本
**答**：问题是 GitHub 有两个分支。Vercel 部署的是 master，代码推到了 main。执行 `git push origin main:master -f` 解决。

---

**问**：能自动化帮我推 Supabase 吗？通过 CLI 或者 MCP
**答**：MCP 没配置好，还是手动在 Supabase SQL Editor 执行最简单。

---

**问**：老是弹出配置窗口
**答**：检查 localStorage 有没有存 teamboard_config。关掉 RLS 后就正常了。

---

**问**：推送吧，叫我怎么部署 Vercel
**答**：写了完整部署指南 `DEPLOY.md`，步骤：
1. GitHub 推代码
2. Vercel Import 仓库
3. Supabase 建表 + 关 RLS
4. 页面配置 Supabase URL 和 Key

---

## 📝 更新约定

每次有重要决策/问题解决后，在最上面加一条：

```
**问**：用户的问题
**答**：解决方法 / 结论
```

太长的技术细节不用写，写结论和怎么解决的就行。
