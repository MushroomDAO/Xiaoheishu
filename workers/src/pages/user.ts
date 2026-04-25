import type { Env, Post, User, Lang } from '../types'
import { i18n } from '../lib/i18n'
import { layout } from '../lib/layout'
import { md } from '../lib/markdown'
import { verifyPassword, getSessionToken, getAuthFromCookie, parseSession } from '../lib/auth'

function formatDate(dt: string, lang: Lang): string {
  return new Date(dt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function userFeedPage(request: Request, env: Env, username: string, lang: Lang): Promise<Response> {
  const url = new URL(request.url)
  const T = i18n(lang)

  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ? AND active = 1').bind(username).first<User>()
  if (!user) return new Response('Not Found', { status: 404 })

  const posts = await env.DB.prepare(
    'SELECT * FROM posts WHERE user_id = ? AND published = 1 ORDER BY created_at DESC'
  ).bind(user.id).all<Post>()

  const displayName = lang === 'en' && user.display_name_en ? user.display_name_en : user.display_name
  const bio = lang === 'en' && user.bio_en ? user.bio_en : (user.bio || '')

  const cards = (posts.results || []).map(post => {
    const images = JSON.parse(post.images || '[]') as string[]
    const tags = JSON.parse(post.tags || '[]') as string[]
    const title = lang === 'en' && post.title_en ? post.title_en : post.title
    const img = post.cover_image || images[0] || ''
    return `<a href="/${post.slug}${lang === 'en' ? '?lang=en' : ''}" class="card">
      ${img ? `<img class="card-img" src="${img}" alt="${title}" loading="lazy">` : `<div class="card-img-placeholder">✍️</div>`}
      <div class="card-body">
        <div class="card-meta">
          ${post.city ? `<span class="tag">📍 ${post.city}</span>` : ''}
          ${tags.slice(0, 2).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <div class="card-title">${title}</div>
        <div class="card-author">${formatDate(post.created_at, lang)}</div>
      </div>
    </a>`
  }).join('')

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "name": displayName,
    "url": `https://${username}.xiaoheishu.xyz`,
    "mainEntity": {
      "@type": "Person",
      "name": displayName,
      "description": bio,
      "url": `https://${username}.xiaoheishu.xyz`
    }
  }

  const body = `
  <div class="user-header">
    <div class="user-avatar">${displayName[0]}</div>
    <div class="user-info">
      <h1>${displayName}</h1>
      <p>${bio}</p>
      ${user.city ? `<span class="user-city">📍 ${user.city}</span>` : ''}
    </div>
  </div>
  <section class="section">
    <h2 class="section-title">${T.latestStories}</h2>
    <div class="grid">
      ${cards || `<p style="color:var(--muted);padding:40px 0">${T.noPostsYet}</p>`}
    </div>
  </section>
  <div style="text-align:center;padding:20px 24px">
    <a href="https://xiaoheishu.xyz${lang === 'en' ? '?lang=en' : ''}" style="color:var(--muted);font-size:13px">← 小黑书 Xiaoheishu</a>
    &nbsp;·&nbsp;
    <a href="/upload" style="color:var(--accent);font-size:13px">${T.uploadTitle}</a>
  </div>`

  const html = layout({ title: displayName, lang, url, body, description: bio, jsonld })
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } })
}

export async function postPage(request: Request, env: Env, username: string, slug: string, lang: Lang): Promise<Response> {
  const url = new URL(request.url)
  const T = i18n(lang)

  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ? AND active = 1').bind(username).first<User>()
  if (!user) return new Response('Not Found', { status: 404 })

  const post = await env.DB.prepare(
    'SELECT * FROM posts WHERE user_id = ? AND slug = ? AND published = 1'
  ).bind(user.id, slug).first<Post>()
  if (!post) return new Response('Not Found', { status: 404 })

  const title = lang === 'en' && post.title_en ? post.title_en : post.title
  const content = lang === 'en' && post.content_en ? post.content_en : post.content
  const images = JSON.parse(post.images || '[]') as string[]
  const quotes = JSON.parse(post.geo_quotes || '[]') as string[]
  const tags = JSON.parse(post.tags || '[]') as string[]
  const displayName = lang === 'en' && user.display_name_en ? user.display_name_en : user.display_name

  const quotesHtml = quotes.length > 0 ? `
    <div class="geo-quotes">
      <div class="geo-quotes-title">${lang === 'zh' ? '关键信息' : 'Key Facts'}</div>
      ${quotes.map(q => `<div class="geo-quote">• ${q}</div>`).join('')}
    </div>` : ''

  const galleryHtml = images.length > 1 ? `
    <div class="post-images">
      ${images.slice(1, 5).map(img => `<img src="${img}" alt="" loading="lazy">`).join('')}
    </div>` : ''

  const jsonld = {
    "@context": "https://schema.org",
    "@type": ["BlogPosting", ...(post.city ? ["Review"] : [])],
    "headline": title,
    "description": quotes[0] || '',
    "image": post.cover_image || images[0],
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "author": { "@type": "Person", "name": displayName, "url": `https://${username}.xiaoheishu.xyz` },
    "publisher": { "@type": "Organization", "name": "小黑书 Xiaoheishu", "url": "https://xiaoheishu.xyz" },
    "keywords": tags.join(', '),
    "inLanguage": lang === 'zh' ? "zh-CN" : "en",
    ...(post.city ? {
      "itemReviewed": { "@type": "City", "name": post.city }
    } : {})
  }

  const body = `
  <div class="post-container">
    ${post.cover_image ? `<img class="post-hero-img" src="${post.cover_image}" alt="${title}">` : ''}
    <div class="post-header">
      <div class="card-meta" style="margin-bottom:12px">
        ${post.city ? `<span class="tag">📍 ${post.city}</span>` : ''}
        ${tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <h1 class="post-title">${title}</h1>
      <div class="post-meta">
        <span>${T.byAuthor} <a href="/${lang === 'en' ? '?lang=en' : ''}">${displayName}</a></span>
        <span>${formatDate(post.created_at, lang)}</span>
      </div>
    </div>
    ${quotesHtml}
    <div class="post-content">${md(content)}</div>
    ${galleryHtml}
    <div style="margin-top:40px;padding-top:24px;border-top:1px solid var(--border);text-align:center">
      <a href="/${lang === 'en' ? '?lang=en' : ''}" style="color:var(--muted);font-size:14px">← ${T.backToTop}</a>
    </div>
  </div>`

  const html = layout({ title, lang, url, body, description: quotes[0] || '', ogImage: post.cover_image || images[0], jsonld })
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } })
}

export async function uploadPage(request: Request, env: Env, username: string, lang: Lang): Promise<Response> {
  const url = new URL(request.url)
  const T = i18n(lang)
  const cookieHeader = request.headers.get('Cookie')
  const token = getAuthFromCookie(cookieHeader)
  const session = token ? parseSession(token) : null
  const authed = session?.username === username

  if (request.method === 'POST') {
    if (!authed) {
      // Check login
      const form = await request.formData()
      const pw = form.get('password') as string
      const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<User & { password_hash: string }>()
      if (!user || !await verifyPassword(pw, (user as any).password_hash)) {
        return loginForm(url, lang, T, 'Wrong password / 密码错误')
      }
      const sessionToken = getSessionToken(username, env.SESSION_SECRET || 'default')
      return new Response('', {
        status: 302,
        headers: {
          Location: `/upload${lang === 'en' ? '?lang=en' : ''}`,
          'Set-Cookie': `xhs_session=${sessionToken}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
        }
      })
    }

    // Authenticated: handle post submission
    const form = await request.formData()
    const title = form.get('title') as string
    const titleEn = form.get('title_en') as string
    const content = form.get('content') as string
    const contentEn = form.get('content_en') as string
    const city = form.get('city') as string
    const tags = (form.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean)
    const slug = title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

    const user = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first<{ id: number }>()
    if (!user) return new Response('User not found', { status: 404 })

    await env.DB.prepare(`
      INSERT INTO posts (user_id, slug, title, title_en, content, content_en, city, tags, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(user.id, slug, title, titleEn || null, content, contentEn || null, city || null, JSON.stringify(tags)).run()

    return new Response('', { status: 302, headers: { Location: `/${slug}${lang === 'en' ? '?lang=en' : ''}` } })
  }

  if (!authed) return loginForm(url, lang, T)

  const body = `
  <div class="form-container">
    <h1 class="form-title">${T.uploadTitle}</h1>
    <form method="POST" enctype="multipart/form-data">
      <div class="form-group"><label>${T.uploadTitleField} (中文)</label><input name="title" required placeholder="标题"></div>
      <div class="form-group"><label>Title (English)</label><input name="title_en" placeholder="English title (optional)"></div>
      <div class="form-group"><label>${T.uploadCityField}</label><input name="city" placeholder="天津 / Tianjin"></div>
      <div class="form-group"><label>Tags (comma separated)</label><input name="tags" placeholder="food, travel, tianjin"></div>
      <div class="form-group"><label>${T.uploadContentField} (中文)</label><textarea name="content" required placeholder="支持 Markdown..."></textarea></div>
      <div class="form-group"><label>Content (English, optional)</label><textarea name="content_en" placeholder="English version (optional)..."></textarea></div>
      <button type="submit" class="form-submit">${T.uploadSubmit}</button>
    </form>
  </div>`

  return new Response(layout({ title: T.uploadTitle, lang, url, body }), { headers: { 'Content-Type': 'text/html;charset=UTF-8' } })
}

function loginForm(url: URL, lang: Lang, T: ReturnType<typeof i18n>, error?: string): Response {
  const body = `
  <div class="form-container">
    <h1 class="form-title">${T.uploadLogin}</h1>
    ${error ? `<p style="color:#f87171;margin-bottom:16px">${error}</p>` : ''}
    <form method="POST">
      <div class="form-group"><label>${T.uploadPassword}</label><input name="password" type="password" required autofocus></div>
      <button type="submit" class="form-submit">${T.uploadLogin}</button>
    </form>
  </div>`
  return new Response(layout({ title: T.uploadLogin, lang, url, body }), { status: error ? 401 : 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } })
}
