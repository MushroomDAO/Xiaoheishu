import { loadSettings } from '../settings'

async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
  const res = await fetch(url)
  const data = await res.json() as { access_token?: string; errmsg?: string; errcode?: number }
  if (!data.access_token) {
    throw new Error(`WeChat token error ${data.errcode}: ${data.errmsg}`)
  }
  return data.access_token
}

// Convert markdown-ish content to minimal WeChat HTML
function toWechatHtml(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

export async function publish(post: Record<string, unknown>) {
  const { wechat_app_id, wechat_app_secret } = loadSettings()

  if (!wechat_app_id || !wechat_app_secret) {
    throw new Error('WeChat credentials not configured — go to Settings → 微信公众号')
  }

  const token = await getAccessToken(wechat_app_id, wechat_app_secret)

  const content = toWechatHtml(String(post.content || ''))

  // Create draft (草稿箱)
  const draftRes = await fetch(
    `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articles: [{
          title: String(post.title || ''),
          content,
          author: '',
          digest: String(post.content || '').slice(0, 120).replace(/\s+/g, ' '),
          content_source_url: '',
          need_open_comment: 0,
          only_fans_can_comment: 0,
        }],
      }),
    }
  )

  const draft = await draftRes.json() as { media_id?: string; errcode?: number; errmsg?: string }
  if (!draft.media_id) {
    throw new Error(`WeChat draft error ${draft.errcode}: ${draft.errmsg}`)
  }

  return {
    url: `https://mp.weixin.qq.com/cgi-bin/appmsg?action=list_card&type=10&begin=0&count=20`,
  }
}
