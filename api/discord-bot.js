const { verifyKey } = require('discord-interactions');
const { Anthropic } = require('@anthropic-ai/sdk');
const { Octokit } = require('@octokit/rest');

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'your-username/my-wiki';

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const octokit = new Octokit({ auth: GITHUB_TOKEN });

function verifyDiscordRequest(req) {
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  const rawBody = JSON.stringify(req.body);
  return verifyKey(rawBody, signature, timestamp, DISCORD_PUBLIC_KEY);
}

async function callClaude(message) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1000,
    system: `你是一个知识库助手。用户会发给你各种想法、笔记、灵感。
请把用户的内容整理成Obsidian知识库格式，包括：
1. 一个清晰的标题
2. 分类标签（AI技术/商业经营/个人成长/其他）
3. 一句话摘要
4. 要点整理

如果用户只是聊天，正常回答即可。`,
    messages: [{ role: 'user', content: message }]
  });
  return response.content[0].text;
}

async function saveToGitHub(content, category) {
  const date = new Date().toISOString().split('T')[0];
  const title = `笔记-${date}-${Math.random().toString(36).substr(2, 5)}`;
  const path = `wiki/${category}/${title}.md`;

  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_REPO.split('/')[0],
      repo: GITHUB_REPO.split('/')[1],
      path,
      message: `添加笔记: ${title}`,
      content: Buffer.from(content).toString('base64'),
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

  if (type === 1) {
    return res.json({ type: 1 });
  }

  if (type === 2) {
    const command = data.name;
    const userId = member.user.id;
    const username = member.user.username;

    if (command === 'chat') {
      const message = data.options.find(o => o.name === 'message').value;

      res.json({
        type: 5,
        data: { content: '🤔 正在思考...' }
      });

      try {
        const claudeResponse = await callClaude(message);
        return res.json({
          type: 4,
          data: { content: claudeResponse }
        });
      } catch (error) {
        return res.json({
          type: 4,
          data: { content: `❌ 出错了: ${error.message}` }
        });
      }
    }

    if (command === 'note') {
      const content = data.options.find(o => o.name === 'content').value;
      const category = data.options.find(o => o.name === 'category')?.value || '其他';

      res.json({
        type: 5,
        data: { content: '📝 正在整理笔记并保存到知识库...' }
      });

      try {
        const processed = await callClaude(content);
        const saved = await saveToGitHub(processed, category);

        if (saved) {
          return res.json({
            type: 4,
            data: {
              content: `✅ 笔记已保存到知识库！\n\n**分类:** ${category}\n\n${processed}`
            }
          });
        } else {
          return res.json({
            type: 4,
            data: { content: '⚠️ 处理完成，但保存到GitHub失败了' }
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
