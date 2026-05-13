with open('index.template.html', 'rb') as f:
    content = f.read().decode('utf-8')

# 替换 CSS：增加个人/公司颜色
old_css = '.log-tag.project { background: rgba(129, 140, 248, 0.2); color: var(--accent); font-weight: 700; }'

new_css = '''.log-tag.project { background: rgba(129, 140, 248, 0.2); color: var(--accent); font-weight: 700; }

        /* 个人 vs 公司 颜色区分 */
        .log-card.personal { border-left: 3px solid #818cf8; }
        .log-card.work { border-left: 3px solid #10b981; }'''

content = content.replace(old_css, new_css)

# 修改 renderLog 函数，增加 cardClass
content = content.replace(
    'function renderLog(e) {',
    '''function renderLog(e) {
            // 判断是个人还是公司项目
            const tags = e.tags || [];
            const isPersonal = tags.some(t => t.includes('开发') || t.includes('个人') || t.includes('AI') || t.includes('时间轴') || t.includes('知识库'));
            const isWork = tags.some(t => t.includes('商业') || t.includes('运营') || t.includes('公司') || t.includes('产品'));
            let cardClass = '';
            if (isPersonal) cardClass = 'personal';
            if (isWork) cardClass = 'work';'''
)

# 修改 return 语句，增加 cardClass
content = content.replace(
    'return '<div class=\"log-card\" onclick=\"',
    'return '<div class=\"log-card ' + cardClass + '\" onclick=\"'
)

with open('index.template.html', 'wb') as f:
    f.write(content.encode('utf-8'))
print('OK')
