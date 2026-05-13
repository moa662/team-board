import json

# 100% 全新的干净模板
template = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的时间轴</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --bg: #0f1117;
            --surface: #1a1d27;
            --border: #2a2d3a;
            --text: #e4e5f1;
            --text-dim: #8b8da3;
            --text-muted: #5c5e72;
            --accent: #818cf8;
            --done: #34d399;
            --radius-lg: 16px;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            padding: 32px 24px;
        }

        .container { max-width: 1200px; margin: 0 auto; }

        .header { margin-bottom: 36px; }
        .header h1 { font-size: 28px; font-weight: 800; }
        .header-sub { font-size: 13px; color: var(--text-muted); margin-top: 6px; }

        .now-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-left: 3px solid var(--accent);
            border-radius: var(--radius-lg);
            padding: 24px 28px;
            margin-bottom: 36px;
        }
        .now-label { font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; margin-bottom: 8px; }
        .now-goal { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .now-focus { font-size: 13px; color: var(--text-dim); }
        .now-meta { font-size: 11px; color: var(--text-muted); margin-top: 10px; }

        /* 图例 */
        .legend { display: flex; gap: 20px; margin-bottom: 16px; align-items: center; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; }
        .legend-dot { width: 12px; height: 12px; border-radius: 3px; }
        .legend-dot.personal { background: #818cf8; }
        .legend-dot.work { background: #10b981; }

        /* 筛选栏 */
        .filter-bar {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 16px 20px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        .filter-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .filter-tag {
            font-size: 11px; font-weight: 600; color: var(--text-dim);
            background: var(--bg); border: 1px solid var(--border);
            padding: 4px 10px; border-radius: 12px; cursor: pointer;
            transition: all 150ms ease;
        }
        .filter-tag:hover { border-color: var(--accent); color: var(--accent); }
        .filter-tag.active { background: var(--accent); border-color: var(--accent); color: #fff; }
        .filter-clear { font-size: 11px; color: var(--text-muted); cursor: pointer; margin-left: auto; }
        .filter-clear:hover { color: var(--accent); }

        .scroll-to-now {
            position: fixed; right: 24px; bottom: 24px;
            background: var(--accent); color: #fff; border: none;
            border-radius: 20px; padding: 8px 16px;
            font-size: 12px; font-weight: 600; cursor: pointer;
            box-shadow: 0 4px 12px rgba(129,140,248,0.4);
        }

        /* 时间轴 */
        .timeline-wrap {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            overflow: hidden;
        }
        .timeline-label {
            padding: 20px 28px;
            font-size: 14px;
            font-weight: 700;
            border-bottom: 1px solid var(--border);
        }
        .timeline-scroll {
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0 0 32px;
            cursor: grab;
        }
        .timeline-scroll:active { cursor: grabbing; }
        .timeline-scroll::-webkit-scrollbar { height: 6px; }
        .timeline-scroll::-webkit-scrollbar-track { background: transparent; }
        .timeline-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

        .axis {
            display: flex;
            align-items: flex-start;
            min-width: max-content;
            padding: 48px 40px 0;
            position: relative;
        }

        /* 里程碑 */
        .segment {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }
        .ms-dot {
            width: 44px; height: 44px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; font-weight: 800; z-index: 2;
        }
        .ms-dot.done { background: linear-gradient(135deg, #34d399, #10b981); color: #fff; }
        .ms-dot.active { background: linear-gradient(135deg, #a5b4fc, #6366f1); color: #fff; transform: scale(1.1); }
        .ms-dot.future { background: var(--surface); border: 2px solid var(--border); color: var(--text-muted); }
        .ms-info { text-align: center; margin-top: 12px; }
        .ms-name { font-size: 13px; font-weight: 700; }
        .ms-date { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
        .ms-desc { font-size: 11px; color: var(--text-dim); margin-top: 4px; max-width: 120px; }

        /* 连接线 + 中间区域 */
        .connector {
            display: flex;
            align-items: flex-start;
            min-width: 40px;
            position: relative;
            padding-top: 22px;
        }
        .connector-line {
            position: absolute;
            top: 22px; left: 0; right: 0; height: 2px;
            background: var(--border);
        }
        .connector-line.done { background: linear-gradient(90deg, var(--done), var(--accent)); }
        .connector-entries { display: flex; gap: 16px; padding: 28px 8px 0; position: relative; z-index: 1; }

        /* 日志卡片 - 按天分组 */
        .day-group { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
        .day-header { font-size: 11px; font-weight: 700; color: var(--accent); margin-bottom: 4px; padding-left: 8px; }

        .log-card {
            background: var(--bg); border: 1px solid var(--border);
            border-radius: 8px; padding: 8px 10px; cursor: pointer;
            transition: all 150ms ease;
            border-left-width: 3px;
        }
        .log-card:hover { border-color: var(--accent); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        /* 个人 vs 公司 颜色 */
        .log-card.personal { border-left-color: #818cf8; }
        .log-card.work { border-left-color: #10b981; }

        .log-card-header { display: flex; align-items: center; gap: 6px; }
        .log-time { font-size: 10px; font-weight: 600; color: var(--text-muted); }
        .log-title { font-size: 12px; font-weight: 600; flex: 1; }
        .log-expand-icon { font-size: 10px; color: var(--text-muted); transition: transform 150ms ease; }
        .log-card.expanded .log-expand-icon { transform: rotate(90deg); }

        .log-detail {
            display: none; margin-top: 6px; padding-top: 6px;
            border-top: 1px solid var(--border);
        }
        .log-card.expanded .log-detail { display: block; }
        .log-text { font-size: 11px; color: var(--text-dim); line-height: 1.5; }

        .log-tags { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
        .log-tag {
            font-size: 9px; font-weight: 600; color: var(--text-muted);
            background: var(--surface); padding: 1px 6px; border-radius: 4px;
            cursor: pointer; transition: all 150ms ease;
        }
        .log-tag:hover { background: var(--accent); color: #fff; }

        .no-logs { font-size: 11px; color: var(--text-muted); padding-top: 28px; font-style: italic; }
        .footer { text-align: center; margin-top: 48px; font-size: 11px; color: var(--text-muted); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>我的时间轴</h1>
            <div class="header-sub">← 按住拖拽浏览完整时间线 →</div>
        </div>
        <div id="app"></div>
        <div class="footer">数据来自 timeline-data.json · 只读展示</div>
    </div>
    <script>const timelineData = {{TIMELINE_DATA}};</script>
    <script>
        let activeFilter = null, allTags = [];

        function render() {
            if (!timelineData) return;
            const { current, milestones, entries } = timelineData;

            let html = renderNow(current) + renderFilterBar(entries);

            // 图例
            html += '<div class="legend"><div class="legend-item"><div class="legend-dot personal"></div><span>个人探索</span></div><div class="legend-item"><div class="legend-dot work"></div><span>公司项目</span></div></div>';

            // 单时间流
            const filteredEntries = activeFilter
                ? entries.filter(e => (e.tags || []).includes(activeFilter))
                : entries;
            html += renderAxis(milestones, filteredEntries);
            html += '<button class="scroll-to-now" onclick="scrollToNow()">回到现在</button>';

            document.getElementById('app').innerHTML = html;
            initDragScroll();
        }

        function scrollToNow() {
            const el = document.querySelector('.timeline-scroll');
            if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
        }

        function setFilterByIndex(idx) {
            activeFilter = activeFilter === allTags[idx] ? null : allTags[idx];
            render();
        }

        function clearFilter() { activeFilter = null; render(); }

        function renderFilterBar(entries) {
            const tagSet = new Set();
            entries.forEach(e => (e.tags || []).forEach(t => tagSet.add(t)));
            allTags = Array.from(tagSet).sort();
            if (allTags.length === 0) return '';
            const tagsHtml = allTags.map((t, i) =>
                '<span class="filter-tag ' + (activeFilter === t ? 'active' : '') + '" onclick="setFilterByIndex(' + i + ')">' + esc(t) + '</span>'
            ).join('');
            return '<div class="filter-bar"><span class="filter-label">标签筛选</span>' + tagsHtml +
                (activeFilter ? '<span class="filter-clear" onclick="clearFilter()">清除筛选</span>' : '') + '</div>';
        }

        function renderNow(c) {
            const start = new Date(c.startDate);
            const days = Math.max(0, Math.floor((Date.now() - start) / 864e5));
            return '<div class="now-card"><div class="now-label">现在</div><div class="now-goal">' + esc(c.goal) + '</div><div class="now-focus">' + esc(c.focus) + '</div><div class="now-meta">' + c.startDate + ' 起 · 预计 ' + c.expectedDays + ' 天 · 已 ' + days + ' 天</div></div>';
        }

        const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

        function renderAxis(milestones, entries) {
            const ms = [...milestones].sort((a, b) => new Date(a.date) - new Date(b.date));
            const es = [...entries].sort((a, b) =>
                new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00'))
            );

            let html = '<div class="timeline-wrap"><div class="timeline-label">时间流</div><div class="timeline-scroll"><div class="axis">';

            ms.forEach((m, i) => {
                const status = m.status === 'completed' ? 'done' : m.status === 'current' ? 'active' : 'future';
                const icon = m.status === 'completed' ? '✓' : m.status === 'current' ? '◉' : (i + 1);
                html += '<div class="segment"><div class="ms-dot ' + status + '">' + icon + '</div><div class="ms-info"><div class="ms-name">' + esc(m.title) + '</div><div class="ms-date">' + m.date + '</div>' +
                    (m.description ? '<div class="ms-desc">' + esc(m.description) + '</div>' : '') + '</div></div>';

                const next = ms[i + 1];
                if (next) {
                    const between = es.filter(e => {
                        const ed = new Date(e.date + ' ' + (e.time || '00:00'));
                        return ed > new Date(m.date + ' 23:59:59') && ed < new Date(next.date + ' 00:00:00');
                    });
                    const lineClass = m.status === 'completed' ? 'done' : '';
                    const entriesHtml = between.length === 0 ? '<div class="no-logs">—</div>' : renderDayGroups(between);
                    const dayCount = [...new Set(between.map(e => e.date))].length;
                    const connWidth = Math.max(200, dayCount * 160);
                    html += '<div class="connector" style="min-width: ' + str(connWidth) + 'px;"><div class="connector-line ' + lineClass + '"></div><div class="connector-entries">' + entriesHtml + '</div></div>';
                }
            });
            html += '</div></div></div>';
            return html;
        }

        function renderDayGroups(entries) {
            const groups = {};
            entries.forEach(e => { if (!groups[e.date]) groups[e.date] = []; groups[e.date].push(e); });
            return Object.keys(groups).sort().map(date => {
                const d = new Date(date);
                const label = str(d.getMonth() + 1) + '/' + str(d.getDate()) + ' 周' + WEEKDAYS[d.getDay()];
                const cards = groups[date].sort((a, b) => (a.time or '').localeCompare(b.time or '')).map(e => renderLog(e)).join('');
                return '<div class="day-group"><div class="day-header">' + label + '</div>' + cards + '</div>';
            }).join('');
        }

        function renderLog(e) {
            // 判断是个人还是公司项目
            const tags = e.tags or [];
            const isPersonal = any(tag.includes('开发') or tag.includes('AI') or tag.includes('时间轴') or tag.includes('知识库') for tag in tags);
            const isWork = any(tag.includes('商业') or tag.includes('运营') or tag.includes('产品') or tag.includes('公司') for tag in tags);
            let cardClass = '';
            if (isPersonal) cardClass = 'personal';
            if (isWork) cardClass = 'work';

            const tagHtml = tags.map((t, i) => {
                const tagIdx = allTags.indexOf(t);
                return '<span class="log-tag" onclick="event.stopPropagation(); if(' + str(tagIdx) + '>=0) setFilterByIndex(' + str(tagIdx) + ')">' + esc(t) + '</span>';
            }).join('');

            return '<div class="log-card ' + cardClass + '" onclick="this.classList.toggle(''expanded'')"><div class="log-card-header"><span class="log-time">' + (e.time or '') + '</span><span class="log-title">' + esc(e.title) + '</span><span class="log-expand-icon">▸</span></div><div class="log-detail">' +
                (e.content ? '<div class="log-text">' + esc(e.content) + '</div>' : '') +
                (tagHtml ? '<div class="log-tags">' + tagHtml + '</div>' : '') + '</div></div>';
        }

        function esc(t) {
            const d = document.createElement('div');
            d.textContent = t;
            return d.innerHTML;
        }

        function initDragScroll() {
            const scrollEl = document.querySelector('.timeline-scroll');
            if (!scrollEl) return;
            let isDown = false, startX, scrollLeft;
            scrollEl.addEventListener('mousedown', e => { isDown = true; startX = e.pageX - scrollEl.offsetLeft; scrollLeft = scrollEl.scrollLeft; e.preventDefault(); });
            scrollEl.addEventListener('mouseleave', () => isDown = false);
            scrollEl.addEventListener('mouseup', () => isDown = false);
            scrollEl.addEventListener('mousemove', e => { if (!isDown) return; e.preventDefault(); const x = e.pageX - scrollEl.offsetLeft; const walk = (x - startX) * 1.5; scrollEl.scrollLeft = scrollLeft - walk; });
        }

        render();
    </script>
</body>
</html>
'''

# 先保存模板
with open('index.template.html', 'wb') as f:
    f.write(template.encode('utf-8'))
print('OK 模板已保存！')

# 然后构建最终 HTML
with open('timeline-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

final_html = template.replace('{{TIMELINE_DATA}}', json.dumps(data, ensure_ascii=False, indent=2))

# 修复 Python 语法转 JS 语法
final_html = final_html.replace('str(', '(').replace(' or ', ' || ')

with open('index.html', 'wb') as f:
    f.write(final_html.encode('utf-8'))
print('OK index.html 已构建完成！')
print(f'里程碑: {len(data["milestones"])} 个')
print(f'日志: {len(data["entries"])} 条')
