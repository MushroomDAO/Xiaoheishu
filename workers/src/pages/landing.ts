import type { Env, Post, Lang } from '../types'
import { i18n } from '../lib/i18n'
import { layout } from '../lib/layout'

function postCard(post: Post & { username: string; display_name: string }, lang: Lang, T: ReturnType<typeof i18n>): string {
  const images = JSON.parse(post.images || '[]') as string[]
  const tags = JSON.parse(post.tags || '[]') as string[]
  const title = lang === 'en' && post.title_en ? post.title_en : post.title
  const img = post.cover_image || images[0] || ''
  const date = post.created_at.split('T')[0]

  return `<a href="https://${post.username}.xiaoheishu.xyz/${post.slug}${lang === 'en' ? '?lang=en' : ''}" class="card">
    ${img
      ? `<img class="card-img" src="${img}" alt="${title}" loading="lazy">`
      : `<div class="card-img-placeholder">🍜</div>`
    }
    <div class="card-body">
      <div class="card-meta">
        ${post.city ? `<span class="tag">${post.city}</span>` : ''}
        ${tags.slice(0, 2).map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="card-title">${title}</div>
      <div class="card-author">${T.byAuthor} ${lang === 'en' && post.display_name ? post.display_name : post.display_name} · ${date}</div>
    </div>
  </a>`
}

export async function landingPage(request: Request, env: Env, lang: Lang): Promise<Response> {
  const url = new URL(request.url)
  const T = i18n(lang)

  const posts = await env.DB.prepare(`
    SELECT p.*, u.username, u.display_name FROM posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.published = 1
    ORDER BY p.created_at DESC LIMIT 12
  `).all<Post & { username: string; display_name: string }>()

  const cards = (posts.results || []).map(p => postCard(p, lang, T)).join('')

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "小黑书 Xiaoheishu",
    "alternateName": "Xiaoheishu",
    "url": "https://xiaoheishu.xyz",
    "description": T.siteDesc,
    "inLanguage": ["zh-CN", "en"],
    "potentialAction": { "@type": "SearchAction", "target": "https://xiaoheishu.xyz/?q={search_term_string}" }
  }

  const body = `
  <div class="hero">
    <h1>${lang === 'zh' ? '<em>小黑书</em> · Xiaoheishu' : '<em>Xiaoheishu</em> · 小黑书'}</h1>
    <p>${T.heroDesc}</p>
    <div class="hero-cta">
      <a href="mailto:hello@xiaoheishu.xyz" class="btn-primary">${T.ctaJoin}</a>
      <a href="#about" class="btn-secondary">${T.ctaLearn}</a>
    </div>
  </div>

  <section class="section">
    <h2 class="section-title">${T.latestStories}</h2>
    <div class="grid">
      ${cards || `<p style="color:var(--muted)">${T.noPostsYet}</p>`}
    </div>
  </section>

  <section class="about-section" id="about">
    <div class="about-inner">
      <h2 class="about-title">${T.aboutTitle}</h2>
      <p class="about-text">${T.aboutP1}</p>
      <p class="about-text">${T.aboutP2}</p>
      <p class="about-text">${T.aboutP3}</p>
      <a href="mailto:hello@xiaoheishu.xyz" class="btn-primary" style="display:inline-block;margin-top:24px">${T.joinWaitlist}</a>
    </div>
  </section>
  `

  const html = layout({
    title: T.heroSubtitle,
    lang,
    url,
    body,
    description: T.siteDesc,
    jsonld,
  })

  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=60' } })
}
