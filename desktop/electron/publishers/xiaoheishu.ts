// Publishes to xiaoheishu.xyz via Workers D1 REST API
// Requires env: XIAOHEISHU_API_URL, XIAOHEISHU_USERNAME, XIAOHEISHU_PASSWORD

export async function publish(post: Record<string, unknown>) {
  const base = process.env.XIAOHEISHU_API_URL || 'https://xiaoheishu.xyz'
  const username = process.env.XIAOHEISHU_USERNAME
  if (!username) throw new Error('XIAOHEISHU_USERNAME not set')

  const tags = JSON.parse((post.tags as string) || '[]')
  const slug = String(post.title).toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

  // TODO: authenticate via session cookie (use upload POST endpoint)
  // For now, use the Workers upload endpoint with password auth
  const form = new FormData()
  form.append('title', String(post.title))
  form.append('title_en', String(post.title_en || ''))
  form.append('content', String(post.content))
  form.append('content_en', String(post.content_en || ''))
  form.append('city', String(post.city || ''))
  form.append('tags', tags.join(', '))

  const res = await fetch(`https://${username}.xiaoheishu.xyz/upload`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok && res.status !== 302) {
    throw new Error(`xiaoheishu.xyz publish failed: ${res.status}`)
  }

  return { url: `https://${username}.xiaoheishu.xyz/${slug}` }
}
