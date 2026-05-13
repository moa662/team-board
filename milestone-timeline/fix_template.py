with open('index.template.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复颜色值
content = content.replace("const color = projectColors[projectName] || '# '#818cf8;'", "const color = projectColors[projectName] || '#818cf8';")

# 移除 now-marker 相关代码
marker_code = '''            // 计算"现在"的位置，如果超出范围就显示在边界
            const firstDate = new Date(ms[0].date).getTime();
            const lastDate = new Date(ms[ms.length - 1].date).getTime();
            const now = Date.now();
            if (now >= firstDate && now <= lastDate) {
                const nowPercent = ((now - firstDate) / (lastDate - firstDate)) * 100;
                html += `<div class="now-marker" style="left: ${nowPercent}%"></div>`;
            }

'''
content = content.replace(marker_code, '')

with open('index.template.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('OK 修复完成')
