import fs from 'fs'
import path from 'path'
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

// Upload cover image as permanent material → returns media_id (required by draft API)
async function uploadCover(token: string, imagePath: string): Promise<string> {
  const resolved = imagePath.replace(/^~/, require('os').homedir())
  if (!fs.existsSync(resolved)) {
    throw new Error(`Cover image not found: ${resolved}`)
  }

  const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`
  const fileBytes = fs.readFileSync(resolved)
  const ext = path.extname(resolved).slice(1).toLowerCase() || 'jpg'
  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif' }
  const mime = mimeMap[ext] || 'image/jpeg'

  const formData = new FormData()
  formData.append('media', new Blob([fileBytes], { type: mime }), path.basename(resolved))

  const res = await fetch(url, { method: 'POST', body: formData })
  const data = await res.json() as { media_id?: string; errcode?: number; errmsg?: string }
  if (!data.media_id) {
    throw new Error(`WeChat cover upload error ${data.errcode}: ${data.errmsg}`)
  }
  return data.media_id
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

  if (!post.cover_image) {
    throw new Error('WeChat requires a cover image — please add one in the editor before publishing')
  }

  const token = await getAccessToken(wechat_app_id, wechat_app_secret)

  // Upload cover as permanent material to get thumb_media_id (required by draft API)
  const thumbMediaId = await uploadCover(token, String(post.cover_image))

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
          thumb_media_id: thumbMediaId,
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
