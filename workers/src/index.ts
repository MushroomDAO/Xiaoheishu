import type { Env, Lang } from './types'
import { detectLang } from './lib/i18n'
import { landingPage } from './pages/landing'
import { userFeedPage, postPage, uploadPage } from './pages/user'
import { adminPage } from './pages/admin'

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

    if (path === '/' || path === '') {
      return userFeedPage(request, env, username, lang)
    }
    if (path === '/upload') {
      return uploadPage(request, env, username, lang)
    }
    // Post slug
    const slug = path.replace(/^\//, '').replace(/\/$/, '')
    if (slug) {
      return postPage(request, env, username, slug, lang)
    }

    return new Response('Not Found', { status: 404 })
  }
}
