import express from 'express'
import { marked } from 'marked'
import { getDb } from './db'

export function startPreviewServer(port: number) {
  const app = express()

  app.get('/preview/:id', (req, res) => {
    const post = getDb().prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!post) return res.status(404).send('Not found')

    const content = marked(String(post.content || ''))
    res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${post.title}</title>
<style>
  :root { --bg:#0a0a0a; --text:#f0f0e8; --accent:#e8c547; --muted:#888; --border:#222; }
  body { background:var(--bg); color:var(--text); font-family:-apple-system,sans-serif;
         max-width:680px; margin:0 auto; padding:40px 24px; line-height:1.7; }
  h1,h2,h3 { color:var(--text); }
  a { color:var(--accent); }
  blockquote { border-left:3px solid var(--accent); margin:0; padding:12px 20px;
               background:#111; border-radius:4px; color:var(--muted); }
  img { max-width:100%; border-radius:8px; }
  code { background:#1a1a1a; padding:2px 6px; border-radius:4px; }
  pre code { display:block; padding:16px; overflow-x:auto; }
</style>
</head>
<body>
  <h1>${post.title}</h1>
  ${post.city ? `<p style="color:var(--muted)">📍 ${post.city}</p>` : ''}
  ${content}
</body>
</html>`)
  })

  app.listen(port)
}
