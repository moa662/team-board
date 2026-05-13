const { verifyKey } = require('discord-interactions');
const { Octokit } = require('@octokit/rest');

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'moa662/team-board';

const octokit = new Octokit({ auth: GITHUB_TOKEN });

function verifyDiscordRequest(req) {
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  const rawBody = JSON.stringify(req.body);
  return verifyKey(rawBody, signature, timestamp, DISCORD_PUBLIC_KEY);
}

function formatNote(content) {
  const date = new Date().toISOString().split('T')[0];
  return `---
title: Discord 笔记 ${date}
created: ${date}
tags: ["Discord", "速记"]
---

# ${date} 随手记

${content}

---
*来自 Discord 机器人自动保存*
`;
}

async function saveToGitHub(content) {
  const date = new Date().toISOString().split('T')[0];
  const title = `discord-${date}-${Math.random().toString(36).substr(2, 5)}`;
  const path = `my-wiki/wiki/${title}.md`;

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO.split('/')[0],
      repo: GITHUB_REPO.split('/')[1],
      path,
      message: `Discord 笔记: ${title}`,
      content: Buffer.from(formatNote(content)).toString('base64'),
      branch: 'main'
    });
    return true;
  } catch (error) {
    console.error('GitHub保存失败:', error);
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyDiscordRequest(req)) {
    return res.status(401).json({ error: 'Invalid request signature' });
  }

  const { type, data, member } = req.body;

  // Ping - 健康检查
  if (type === 1) {
    return res.json({ type: 1 });
  }

  // Slash command
  if (type === 2) {
    const command = data.name;

    if (command === 'note') {
      const content = data.options.find(o => o.name === 'content').value;

      // 先 ACK，避免 3 秒超时
      res.json({
        type: 5,
        data: { content: '📝 正在保存笔记...' }
      });

      try {
        const saved = await saveToGitHub(content);

        if (saved) {
          return res.json({
            type: 4,
            data: {
              content: `✅ 笔记已保存到 GitHub 知识库！\n\n**内容:** ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
            }
          });
        } else {
          return res.json({
            type: 4,
            data: { content: '⚠️ GitHub Token 未配置或保存失败，笔记：\n' + content }
          });
        }
      } catch (error) {
        return res.json({
          type: 4,
          data: { content: `❌ 出错了: ${error.message}` }
        });
      }
    }
  }

  return res.status(400).json({ error: 'Unknown interaction type' });
};
