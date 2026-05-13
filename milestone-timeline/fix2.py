with open('index.template.html', 'rb') as f:
    content = f.read().decode('utf-8')

# 1. 修改 render 函数：去掉多时间流，改回单时间流
old_render = '''        function render() {
            if (!timelineData) return;
            const { current, milestones, entries } = timelineData;

            // 按项目分组
            const entriesByProject = {};
            entries.forEach(e => {
                const projectTags = (e.tags || []).filter(t =>
                    t.includes('项目') || t.includes('开发') || t.includes('设计') ||
                    t.includes('运营') || t.includes('知识库') || t.includes('商业')
                );
                const project = projectTags[0] || '未分类';
                if (!entriesByProject[project]) entriesByProject[project] = [];
                entriesByProject[project].push(e);
            });

            let html = renderNow(current) + renderFilterBar(entries);

            // 为每个项目渲染一条独立的时间轴
            Object.keys(entriesByProject).sort().forEach(project => {
                // 如果有筛选，只显示匹配的项目
                if (activeFilter && !entriesByProject[project].some(e =>
                    (e.tags || []).includes(activeFilter)
                )) {
                    return;
                }
                html += renderAxis(project, milestones, entriesByProject[project]);
            });

            html += '<button class="scroll-to-now" onclick="scrollToNow()">回到现在</button>';

            document.getElementById('app').innerHTML = html;

            // 初始化拖拽
            initDragScroll();
        }'''

new_render = '''        function render() {
            if (!timelineData) return;
            const { current, milestones, entries } = timelineData;

            let html = renderNow(current) + renderFilterBar(entries);

            // 单时间流：只显示有筛选的条目，否则显示全部
            const filteredEntries = activeFilter
                ? entries.filter(e => (e.tags || []).includes(activeFilter))
                : entries;

            html += renderAxis(milestones, filteredEntries);
            html += '<button class="scroll-to-now" onclick="scrollToNow()">回到现在</button>';

            document.getElementById('app').innerHTML = html;
            initDragScroll();
        }'''

content = content.replace(old_render, new_render)

# 2. 修改 renderAxis 函数签名
content = content.replace(
    'function renderAxis(projectName, milestones, entries)',
    'function renderAxis(milestones, entries)'
)

# 3. 去掉项目颜色相关代码
old_colors = '''            // 项目颜色映射
            const projectColors = {
                '时间轴项目': '#818cf8', 'AI开发': '#a855f7', '产品设计': '#f093fb',
                '知识库': '#2dd4bf', '短视频运营': '#fbbf24', '商业经营': '#10b981', '未分类': '#6b7280'
            };
            const color = projectColors[projectName] || '#818cf8';
            let html = '<div class="timeline-wrap"><div class="timeline-label" style="color: ' + color + ';">📌 ' + projectName + '</div><div class="timeline-scroll"><div class="axis">';'''

new_colors = '''            let html = '<div class="timeline-wrap"><div class="timeline-label">时间流</div><div class="timeline-scroll"><div class="axis">';'''
content = content.replace(old_colors, new_colors)

with open('index.template.html', 'wb') as f:
    f.write(content.encode('utf-8'))
print('OK 模板修改完成')
