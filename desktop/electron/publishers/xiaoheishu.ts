import { loadSettings } from '../settings'

async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`https://${username}.xiaoheishu.xyz/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
    throw new Error(`Login failed: ${err.error || res.status}`)
  }
  const data = await res.json() as { token: string }
  return data.token
}

export async function publish(post: Record<string, unknown>) {
  const { xhs_username: username, xhs_password: password } = loadSettings()

  if (!username || !password) {
    throw new Error('小黑书 credentials not configured — go to Settings → 小黑书')
  }

  const tags: string[] = (() => {
    try { return JSON.parse(String(post.tags || '[]')) } catch { return [] }
  })()

  const token = await login(username, password)

  const res = await fetch(`https://${username}.xiaoheishu.xyz/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: post.title,
      title_en: post.title_en || '',
      content: post.content,
      content_en: post.content_en || '',
      city: post.city || '',
      tags,
      cover_image: post.cover_image || '',
      images: post.images || '[]',
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => String(res.status))
    throw new Error(`xiaoheishu.xyz ${res.status}: ${text}`)
  }

  const data = await res.json() as { slug?: string; url?: string }
  return { url: data.url || `https://${username}.xiaoheishu.xyz/${data.slug || ''}` }
}
