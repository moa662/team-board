// api/fetch-volcengine-usage.js
// Vercel 云函数 - 定时抓取火山方舟用量
// 配置：每小时自动运行一次

import { createHmac } from 'crypto'

// ========== 火山引擎签名算法 ==========
function hmacSha256(key, msg) {
  return createHmac('sha256', key).update(msg).digest()
}

function sha256Hex(msg) {
  return createHmac('sha256', '').update(msg).digest('hex')
}

function getSignature(sk, date, region, service, stringToSign) {
  const kDate = hmacSha256(sk, date)
  const kRegion = hmacSha256(kDate, region)
  const kService = hmacSha256(kRegion, service)
  const kSigning = hmacSha256(kService, 'request')
  return createHmac('sha256', kSigning).update(stringToSign).digest('hex')
}

// ========== 主函数 ==========
export default async function handler(req, res) {
  // 从环境变量读取配置
  const AK = process.env.VOLCENGINE_AK
  const SK = process.env.VOLCENGINE_SK
  const API_KEY_ID = process.env.VOLCENGINE_API_KEY_ID
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

  if (!AK || !SK || !API_KEY_ID || !SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(400).json({ error: '缺少必要的环境变量' })
  }

  const now = new Date()
  const endTime = Math.floor(now.getTime() / 1000)
  const startTime = endTime - 86400 * 7 // 最近7天

  // 时间字符串格式：YYYYMMDDTHHMMSSZ
  const dateStr = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const shortDate = dateStr.slice(0, 8) // YYYYMMDD

  const region = 'cn-beijing'
  const service = 'ark'
  const algorithm = 'HMAC-SHA256'
  const credentialScope = `${shortDate}/${region}/${service}/request`

  // 请求体
  const payload = {
    StartTime: startTime,
    EndTime: endTime,
    Granularity: 'Day',
    Dimensions: [
      { Name: 'ModelName', Value: 'ark-code-latest' },
      { Name: 'ApiKeyId', Value: API_KEY_ID }
    ],
    MetricNames: ['PromptTokens', 'CompletionTokens', 'RequestCount']
  }

  const payloadStr = JSON.stringify(payload)

  // 构造规范请求
  const canonicalMethod = 'POST'
  const canonicalUri = '/'
  const canonicalQueryString = ''
  const canonicalHeaders = 'content-type:application/json\n' + 'x-date:' + dateStr + '\n'
  const signedHeaders = 'content-type;x-date'
  const hashedPayload = sha256Hex(payloadStr)

  const canonicalRequest = [
    canonicalMethod,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedPayload
  ].join('\n')

  const stringToSign = [
    algorithm,
    dateStr,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n')

  const signature = getSignature(SK, shortDate, region, service, stringToSign)

  const authorization = `${algorithm} Credential=${AK}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  try {
    console.log('开始调用火山引擎 API...')

    // 调用火山引擎 API
    const response = await fetch('https://open.volcengineapi.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Date': dateStr,
        'Authorization': authorization
      },
      body: payloadStr
    })

    const data = await response.json()
    console.log('API 返回:', JSON.stringify(data, null, 2))

    if (data.Error) {
      throw new Error(`${data.Error.Code}: ${data.Error.Message}`)
    }

    // 汇总用量
    const promptTokens = (data.UsageResults?.find(m => m.Name === 'PromptTokens')?.MetricItems || [])
      .reduce((sum, item) => sum + (item.Value || 0), 0)

    const completionTokens = (data.UsageResults?.find(m => m.Name === 'CompletionTokens')?.MetricItems || [])
      .reduce((sum, item) => sum + (item.Value || 0), 0)

    const totalTokens = promptTokens + completionTokens

    console.log(`用量汇总: 输入 ${promptTokens}, 输出 ${completionTokens}, 总计 ${totalTokens}`)

    // 写入 Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const sbClient = createClient(SUPABASE_URL, SUPABASE_KEY)

    // 先删旧数据
    await sbClient.from('metrics').delete().eq('source', 'volcengine')

    // 插新数据
    await sbClient.from('metrics').insert([
      { source: 'volcengine', metric_name: 'prompt_tokens', value: promptTokens, unit: 'tokens' },
      { source: 'volcengine', metric_name: 'completion_tokens', value: completionTokens, unit: 'tokens' },
      { source: 'volcengine', metric_name: 'total_tokens', value: totalTokens, unit: 'tokens' }
    ])

    console.log('已写入 Supabase')

    res.status(200).json({
      ok: true,
      promptTokens,
      completionTokens,
      totalTokens
    })

  } catch (e) {
    console.error('抓取失败:', e)
    res.status(500).json({ error: e.message })
  }
}
