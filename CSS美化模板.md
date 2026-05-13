# CSS 美化快速套用模板

> 功能验证完成后，直接复制这些样式到项目中，快速完成包装。

---

## 📦 套装一：Apple Fitness+ 深色运动风格

```css
/* ===== 全局基础样式 ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: #121212;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* ===== 卡片组件：大圆角 + 深色分层 ===== */
.card {
  background-color: #1e1e1e;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* ===== 按钮样式：高亮绿色 + 圆角 ===== */
.btn {
  background-color: #22c55e;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background-color: #16a34a;
  transform: translateY(-1px);
}

.btn:active {
  transform: scale(0.98);
}

/* 次要按钮 */
.btn-secondary {
  background-color: #2d2d2d;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #3a3a3a;
}

/* ===== 数据高亮：关键数字突出 ===== */
.highlight {
  color: #4ade80;
  font-size: 24px;
  font-weight: 700;
}

/* 红色高亮（支出/错误） */
.highlight-red {
  color: #ef4444;
  font-size: 24px;
  font-weight: 700;
}

/* 蓝色高亮（收入/信息） */
.highlight-blue {
  color: #3b82f6;
  font-size: 24px;
  font-weight: 700;
}

/* ===== 文字层级 ===== */
.text-primary {
  color: #ffffff;
  font-weight: 600;
}

.text-secondary {
  color: #a3a3a3;
  font-size: 14px;
}

.text-tertiary {
  color: #6b7280;
  font-size: 12px;
}

/* ===== 状态标签 ===== */
.tag {
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 600;
}

.tag-green {
  background-color: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.tag-red {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.tag-blue {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.tag-gray {
  background-color: rgba(75, 85, 99, 0.3);
  color: #9ca3af;
}

/* ===== 输入框 ===== */
.input {
  background: #2d2d2d;
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  padding: 12px 16px;
  transition: background 0.15s ease;
}

.input:focus {
  outline: none;
  background: #3a3a3a;
}

.input::placeholder {
  color: #6b7280;
}

/* ===== 分隔线 ===== */
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 16px 0;
}

/* ===== 淡入动画 ===== */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.4s ease-out forwards;
}

/* ===== 底部导航栏 ===== */
.bottom-nav {
  background: #1a1a1a !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
}
```

---

## 📦 套装二：Notion 极简浅色风格

```css
/* ===== 全局基础样式 ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #ffffff;
  color: #37352f;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
  min-height: 100vh;
}

/* ===== 卡片组件：极简边框 ===== */
.card {
  background: #ffffff;
  border: 1px solid rgba(55, 53, 47, 0.09);
  border-radius: 8px;
  padding: 16px;
  transition: background 0.15s ease;
}

.card:hover {
  background: rgba(55, 53, 47, 0.03);
}

/* ===== 按钮样式：极简 ===== */
.btn {
  background: #2383e2;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  padding: 10px 16px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn:hover {
  background: #1b77d1;
}

.btn-secondary {
  background: #ffffff;
  border: 1px solid rgba(55, 53, 47, 0.16);
  color: #37352f;
}

.btn-secondary:hover {
  background: rgba(55, 53, 47, 0.04);
}

/* ===== 文字层级 ===== */
.text-primary { color: #37352f; }
.text-secondary { color: #787774; }
.text-tertiary { color: #9b9a97; }
.text-blue { color: #2383e2; }

/* ===== 状态标签 ===== */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.tag-blue { background: rgba(35, 131, 226, 0.15); color: #2383e2; }
.tag-green { background: rgba(16, 185, 129, 0.15); color: #0ea575; }
.tag-red { background: rgba(235, 87, 87, 0.15); color: #eb5757; }
.tag-gray { background: rgba(55, 53, 47, 0.08); color: #787774; }
```

---

## 🚀 快速使用步骤

1. **功能开发完成后**，复制对应套装的 CSS 到 `index.css`
2. 在组件中直接使用类名：
   ```tsx
   <div className="card">
     <h2 className="text-primary">标题</h2>
     <p className="text-secondary">描述文字</p>
     <div className="highlight">¥1234</div>
     <button className="btn">确认</button>
   </div>
   ```
3. 微调细节（间距、字号等）
4. ✅ 美化完成！

---

## 🎨 风格选择指南

| 场景 | 推荐风格 |
|------|---------|
| 运动健身、健康类 App | Apple Fitness+ 深色风格 |
| 笔记、文档、工具类 | Notion 极简浅色风格 |
| 后台管理系统 | Notion 极简浅色风格 |
| 社交、内容类 App | Apple Fitness+ 深色风格 |
