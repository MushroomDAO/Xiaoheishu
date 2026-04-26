import express from 'express'
import { marked } from 'marked'
import path from 'path'
import { app as electronApp } from 'electron'
import { getDb } from './db'

function parseTags(raw: string): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) as string[] } catch { /* fall through */ }
  return raw.split(',').map(t => t.trim()).filter(Boolean)
}

const BANNERS = ['banner-sky.png', 'banner-field.png', 'banner-tianjin.png']

const CSS = (light: boolean) => `
  :root {
    --bg: ${light ? '#f9f9f7' : '#1c1c1e'};
    --surface: ${light ? '#ffffff' : '#2c2c2e'};
    --text: ${light ? '#1a1a1a' : '#f0f0e8'};
    --accent: #c8993a;
    --muted: ${light ? '#666' : '#999'};
    --border: ${light ? '#e5e5e5' : '#3a3a3c'};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: -apple-system, 'PingFang SC', sans-serif;
         max-width: 720px; margin: 0 auto; padding: 0 24px 60px; line-height: 1.8; }
  .site-header { padding: 20px 0 16px; border-bottom: 1px solid var(--border); margin-bottom: 32px;
                 display: flex; align-items: center; justify-content: space-between; }
  .site-name { font-size: 18px; font-weight: 700; color: var(--accent); text-decoration: none; }
  .theme-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
               padding: 4px 12px; font-size: 12px; color: var(--muted); cursor: pointer; }
  h1 { font-size: 26px; font-weight: 700; line-height: 1.3; margin-bottom: 12px; }
  h2 { font-size: 20px; margin: 32px 0 12px; }
  h3 { font-size: 16px; margin: 24px 0 8px; }
  p { margin-bottom: 16px; }
  a { color: var(--accent); }
  blockquote { border-left: 3px solid var(--accent); margin: 20px 0; padding: 12px 20px;
               background: var(--surface); border-radius: 0 6px 6px 0; color: var(--muted); }
  img { max-width: 100%; border-radius: 10px; margin: 12px 0; }
  code { background: var(--surface); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  pre { background: var(--surface); padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
  pre code { background: none; padding: 0; }
  .post-meta { color: var(--muted); font-size: 13px; margin-bottom: 32px; display: flex; gap: 12px; }
  .tag { background: var(--surface); border: 1px solid var(--border); border-radius: 100px;
         padding: 2px 10px; font-size: 12px; }
  .post-card { border: 1px solid var(--border); border-radius: 12px; padding: 20px;
               margin-bottom: 16px; text-decoration: none; display: block; color: inherit;
               transition: border-color 0.15s; }
  .post-card:hover { border-color: var(--accent); }
  .post-card-title { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
  .post-card-meta { font-size: 12px; color: var(--muted); }
`

function pageShell(title: string, body: string, light: boolean, backUrl = '') {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · 小黑书</title>
<style>${CSS(light)}</style>
</head>
<body>
<header class="site-header">
  <a class="site-name" href="/">小黑书 · My Life</a>
  <button class="theme-btn" onclick="location.search=location.search.includes('light=0')?'':'?light=0'">
    ${light ? '🌙 Dark' : '☀️ Light'}
  </button>
</header>
${backUrl ? `<p style="margin-bottom:24px"><a href="${backUrl}" style="font-size:13px;color:var(--muted)">← Back</a></p>` : ''}
${body}
</body>
</html>`
}

export function startPreviewServer(port: number) {
  const app = express()

  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
  })

  // Serve banner images
  const assetsDir = path.join(__dirname, '../../assets')
  app.use('/assets', express.static(assetsDir))

  // Serve user-uploaded images
  const imagesDir = path.join(electronApp.getPath('userData'), 'images')
  app.use('/user-images', express.static(imagesDir))

  // Homepage — list all posts
  app.get('/', (req, res) => {
    const light = req.query['light'] !== '0'
    const banner = BANNERS[Math.floor(Math.random() * BANNERS.length)]
    const posts = getDb().prepare(
      'SELECT id, title, title_en, city, tags, created_at FROM posts ORDER BY created_at DESC'
    ).all() as Record<string, unknown>[]

    const bannerHtml = `
      <div style="width:100%;height:200px;margin-bottom:32px;border-radius:14px;overflow:hidden;position:relative;">
        <img src="/assets/${banner}" style="width:100%;height:100%;object-fit:cover;object-position:center 40%;">
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.5));border-radius:14px;"></div>
        <div style="position:absolute;bottom:16px;left:20px;color:#fff;font-size:22px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,0.5);">My Life · 我的生活</div>
      </div>`

    const cards = posts.map(p => {
      const tags = parseTags(String(p.tags || ''))
      return `<a href="/preview/${p.id}${light ? '' : '?light=0'}" class="post-card">
        <div class="post-card-title">${p.title}</div>
        <div class="post-card-meta">
          ${p.city ? `📍 ${p.city} · ` : ''}
          ${String(p.created_at || '').split('T')[0]}
          ${tags.slice(0, 3).map((t: string) => `<span class="tag">${t}</span>`).join(' ')}
        </div>
      </a>`
    }).join('')

    res.send(pageShell('My Life', bannerHtml + (cards || '<p style="color:var(--muted)">No posts yet.</p>'), light))
  })

  // Single post preview
  app.get('/preview/:id', (req, res) => {
    const light = req.query['light'] !== '0'
    const post = getDb().prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!post) return res.status(404).send('Not found')

    const tags = parseTags(String(post.tags || ''))
    const content = marked(String(post.content || ''))
    const meta = [
      post.city ? `📍 ${post.city}` : '',
      String(post.created_at || '').split('T')[0],
      ...tags.map((t: string) => `<span class="tag">${t}</span>`)
    ].filter(Boolean).join(' · ')

    // Cover image — stored as absolute path, serve via /user-images/
    const coverImg = post.cover_image
      ? `<img src="/user-images/${path.basename(String(post.cover_image))}"
             style="width:100%;max-height:360px;object-fit:cover;border-radius:12px;margin-bottom:24px;">`
      : ''

    const body = `
      ${coverImg}
      <h1>${post.title}</h1>
      <div class="post-meta">${meta}</div>
      ${content}`

    res.send(pageShell(String(post.title), body, light, '/'))
  })

  app.listen(port)
  console.log(`[preview] http://localhost:${port}`)
}
