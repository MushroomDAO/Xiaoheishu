import type { Env, Lang } from './types'
import { detectLang } from './lib/i18n'
import { landingPage } from './pages/landing'
import { userFeedPage, postPage, uploadPage } from './pages/user'
import { adminPage } from './pages/admin'
import { verifyPassword, getSessionToken, parseSession } from './lib/auth'

const apiCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
}

function jsonOk(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: apiCors })
}

function jsonErr(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: apiCors })
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `post-${Date.now()}`
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const host = request.headers.get('host') || ''
    const lang: Lang = detectLang(url, request.headers.get('Accept-Language'))

    // CORS headers for AI crawlers
    const corsHeaders = {
      'X-Robots-Tag': 'index, follow',
      'Access-Control-Allow-Origin': '*',
    }

    // Determine subdomain
    const baseDomain = env.BASE_DOMAIN || 'xiaoheishu.xyz'
    const subdomain = host.replace(`.${baseDomain}`, '').replace(baseDomain, '')
    const isMainDomain = !subdomain || subdomain === 'www' || host === baseDomain || host === `www.${baseDomain}`

    // robots.txt
    if (url.pathname === '/robots.txt') {
      return new Response(
        `User-agent: *\nAllow: /\nUser-agent: GPTBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nSitemap: https://${baseDomain}/sitemap.xml`,
        { headers: { 'Content-Type': 'text/plain' } }
      )
    }

    // Sitemap
    if (url.pathname === '/sitemap.xml' && isMainDomain) {
      const posts = await env.DB.prepare(`
        SELECT p.slug, p.updated_at, u.username FROM posts p
        JOIN users u ON u.id = p.user_id WHERE p.published = 1
      `).all<{ slug: string; updated_at: string; username: string }>()

      const urls = [
        `<url><loc>https://${baseDomain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
        ...((posts.results || []).map(p =>
          `<url><loc>https://${p.username}.${baseDomain}/${p.slug}</loc><lastmod>${p.updated_at.split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
        ))
      ].join('\n')

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
        { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
      )
    }

    // Main domain
    if (isMainDomain) {
      if (url.pathname === '/admin' || url.pathname === '/admin/') {
        return adminPage(request, env, lang)
      }
      return landingPage(request, env, lang)
    }

    // Subdomain routing: {username}.xiaoheishu.xyz
    const username = subdomain
    const path = url.pathname

    // JSON API — CORS preflight
    if (request.method === 'OPTIONS' && path.startsWith('/api/')) {
      return new Response(null, { status: 204, headers: apiCors })
    }

    // POST /api/login
    if (path === '/api/login' && request.method === 'POST') {
      let body: { password?: string }
      try { body = await request.json() } catch { return jsonErr('Invalid JSON', 400) }
      if (!body.password) return jsonErr('password required', 400)

      const user = await env.DB.prepare(
        'SELECT password_hash FROM users WHERE username = ? AND active = 1'
      ).bind(username).first<{ password_hash: string }>()

      if (!user) return jsonErr('User not found', 404)

      const ok = await verifyPassword(body.password, user.password_hash)
      if (!ok) return jsonErr('Invalid password', 401)

      const token = getSessionToken(username, env.SESSION_SECRET || 'secret')
      return jsonOk({ token, expires: Date.now() + 86400000 })
    }

    // POST /api/posts
    if (path === '/api/posts' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization') || ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
      if (!token) return jsonErr('Authorization required', 401)

      const session = parseSession(token)
      if (!session || session.username !== username) return jsonErr('Invalid or expired token', 401)

      let body: Record<string, unknown>
      try { body = await request.json() } catch { return jsonErr('Invalid JSON', 400) }

      const title = String(body.title || '').trim()
      if (!title) return jsonErr('title required', 400)

      const user = await env.DB.prepare(
        'SELECT id FROM users WHERE username = ? AND active = 1'
      ).bind(username).first<{ id: number }>()
      if (!user) return jsonErr('User not found', 404)

      const baseSlug = slugify(title)
      // Ensure unique slug by appending timestamp if collision
      let slug = baseSlug
      const existing = await env.DB.prepare(
        'SELECT id FROM posts WHERE user_id = ? AND slug = ?'
      ).bind(user.id, slug).first()
      if (existing) slug = `${baseSlug}-${Date.now()}`

      const tags = (() => {
        const t = body.tags
        if (!t) return '[]'
        if (Array.isArray(t)) return JSON.stringify(t)
        const s = String(t).trim()
        try { JSON.parse(s); return s } catch { /* */ }
        return JSON.stringify(s.split(',').map((x: string) => x.trim()).filter(Boolean))
      })()

      await env.DB.prepare(`
        INSERT INTO posts (user_id, slug, title, title_en, content, content_en, cover_image, images, tags, city)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user.id, slug,
        title,
        String(body.title_en || ''),
        String(body.content || ''),
        String(body.content_en || ''),
        String(body.cover_image || ''),
        String(body.images || '[]'),
        tags,
        String(body.city || ''),
      ).run()

      const baseDomain = env.BASE_DOMAIN || 'xiaoheishu.xyz'
      return jsonOk({ slug, url: `https://${username}.${baseDomain}/${slug}` }, 201)
    }

    if (path === '/' || path === '') {
      return userFeedPage(request, env, username, lang)
    }
    if (path === '/upload') {
      return uploadPage(request, env, username, lang)
    }
    // Post slug
    const postSlug = path.replace(/^\//, '').replace(/\/$/, '')
    if (postSlug) {
      return postPage(request, env, username, postSlug, lang)
    }

    return new Response('Not Found', { status: 404 })
  }
}
