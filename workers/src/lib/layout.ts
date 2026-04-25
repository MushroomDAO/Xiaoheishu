import type { Lang } from '../types'
import { i18n, toggleLangUrl } from './i18n'

export function layout(opts: {
  title: string
  lang: Lang
  url: URL
  body: string
  description?: string
  ogImage?: string
  jsonld?: object
}): string {
  const { title, lang, url, body, description, ogImage, jsonld } = opts
  const T = i18n(lang)
  const toggleUrl = toggleLangUrl(url, lang)
  const dir = lang === 'zh' ? 'ltr' : 'ltr'
  const desc = description || T.siteDesc

  return `<!DOCTYPE html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} · ${T.siteName}</title>
  <meta name="description" content="${desc.replace(/"/g, '&quot;')}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}">
  ${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
  <meta property="og:type" content="website">
  <meta name="robots" content="index, follow">
  <link rel="alternate" hreflang="zh" href="${toggleLangUrl(url, 'en')}">
  <link rel="alternate" hreflang="en" href="${toggleLangUrl(url, 'zh')}">
  ${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0a0a;
      --surface: #141414;
      --border: #222;
      --text: #f0f0e8;
      --muted: #888;
      --accent: #e8c547;
      --accent-hover: #d4b03a;
      --radius: 12px;
      --font: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif;
    }
    body { background: var(--bg); color: var(--text); font-family: var(--font); line-height: 1.6; min-height: 100vh; }
    a { color: inherit; text-decoration: none; }
    img { max-width: 100%; height: auto; display: block; }

    /* NAV */
    nav { position: sticky; top: 0; z-index: 100; background: rgba(10,10,10,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 0 24px; display: flex; align-items: center; height: 56px; gap: 16px; }
    .nav-logo { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }
    .nav-logo span { color: var(--accent); }
    .nav-spacer { flex: 1; }
    .lang-btn { border: 1px solid var(--border); background: transparent; color: var(--muted); padding: 6px 14px; border-radius: 20px; font-size: 13px; cursor: pointer; transition: all 0.2s; }
    .lang-btn:hover { border-color: var(--accent); color: var(--accent); }

    /* HERO */
    .hero { padding: 80px 24px 60px; text-align: center; max-width: 680px; margin: 0 auto; }
    .hero h1 { font-size: clamp(32px, 6vw, 56px); font-weight: 800; letter-spacing: -1px; line-height: 1.1; margin-bottom: 20px; }
    .hero h1 em { font-style: normal; color: var(--accent); }
    .hero p { color: var(--muted); font-size: 17px; margin-bottom: 32px; }
    .hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-primary { background: var(--accent); color: #000; padding: 12px 28px; border-radius: 24px; font-weight: 600; font-size: 15px; transition: background 0.2s; cursor: pointer; border: none; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-secondary { border: 1px solid var(--border); color: var(--text); padding: 12px 28px; border-radius: 24px; font-size: 15px; transition: border-color 0.2s; }
    .btn-secondary:hover { border-color: var(--accent); }

    /* FEED / CARDS */
    .section { padding: 40px 24px; max-width: 1100px; margin: 0 auto; }
    .section-title { font-size: 20px; font-weight: 700; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
    .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: transform 0.2s, border-color 0.2s; cursor: pointer; }
    .card:hover { transform: translateY(-2px); border-color: #333; }
    .card-img { aspect-ratio: 4/3; object-fit: cover; width: 100%; background: #1a1a1a; }
    .card-img-placeholder { aspect-ratio: 4/3; background: linear-gradient(135deg, #1a1a1a, #222); display: flex; align-items: center; justify-content: center; font-size: 40px; }
    .card-body { padding: 16px; }
    .card-meta { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .tag { font-size: 11px; color: var(--accent); background: rgba(232,197,71,0.1); padding: 3px 8px; border-radius: 10px; }
    .card-title { font-size: 15px; font-weight: 600; line-height: 1.4; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-author { font-size: 12px; color: var(--muted); }

    /* POST */
    .post-container { max-width: 720px; margin: 40px auto; padding: 0 24px 80px; }
    .post-hero-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: var(--radius); margin-bottom: 32px; background: #1a1a1a; }
    .post-header { margin-bottom: 32px; }
    .post-title { font-size: clamp(24px, 4vw, 36px); font-weight: 800; line-height: 1.2; margin-bottom: 16px; }
    .post-meta { display: flex; gap: 16px; color: var(--muted); font-size: 14px; flex-wrap: wrap; }
    .post-content { font-size: 17px; line-height: 1.8; }
    .post-content h2 { font-size: 22px; font-weight: 700; margin: 36px 0 16px; }
    .post-content h3 { font-size: 18px; font-weight: 600; margin: 28px 0 12px; }
    .post-content p { margin-bottom: 16px; }
    .post-content ul, .post-content ol { padding-left: 24px; margin-bottom: 16px; }
    .post-content li { margin-bottom: 6px; }
    .post-content blockquote { border-left: 3px solid var(--accent); padding: 12px 20px; margin: 24px 0; background: rgba(232,197,71,0.06); border-radius: 0 8px 8px 0; }
    .post-content blockquote p { margin: 0; color: var(--text); font-style: italic; }
    .post-content strong { color: #fff; font-weight: 600; }
    .post-content table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px; }
    .post-content th, .post-content td { padding: 10px 14px; border: 1px solid var(--border); text-align: left; }
    .post-content th { background: var(--surface); font-weight: 600; }
    .post-content img { border-radius: 8px; margin: 20px 0; width: 100%; }
    .post-images { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 24px 0; }
    .post-images img { border-radius: 8px; aspect-ratio: 4/3; object-fit: cover; }

    /* GEO QUOTES */
    .geo-quotes { margin: 40px 0; padding: 24px; background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); }
    .geo-quotes-title { font-size: 13px; color: var(--muted); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
    .geo-quote { padding: 12px 0; border-bottom: 1px solid var(--border); color: var(--text); font-size: 15px; line-height: 1.6; }
    .geo-quote:last-child { border-bottom: none; padding-bottom: 0; }

    /* ABOUT */
    .about-section { background: var(--surface); border-top: 1px solid var(--border); padding: 60px 24px; margin-top: 40px; }
    .about-inner { max-width: 680px; margin: 0 auto; }
    .about-title { font-size: 24px; font-weight: 700; margin-bottom: 20px; }
    .about-text { color: var(--muted); font-size: 16px; line-height: 1.8; margin-bottom: 16px; }

    /* FOOTER */
    footer { padding: 24px; text-align: center; color: var(--muted); font-size: 13px; border-top: 1px solid var(--border); }

    /* FORM */
    .form-container { max-width: 640px; margin: 40px auto; padding: 0 24px 80px; }
    .form-title { font-size: 28px; font-weight: 700; margin-bottom: 32px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; font-size: 14px; color: var(--muted); margin-bottom: 8px; }
    input, textarea, select { width: 100%; background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 12px 16px; border-radius: 8px; font-size: 15px; font-family: var(--font); outline: none; transition: border-color 0.2s; }
    input:focus, textarea:focus { border-color: var(--accent); }
    textarea { min-height: 240px; resize: vertical; }
    .form-submit { width: 100%; background: var(--accent); color: #000; border: none; padding: 14px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .form-submit:hover { background: var(--accent-hover); }

    /* ADMIN */
    .admin-container { max-width: 900px; margin: 40px auto; padding: 0 24px 80px; }
    .admin-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .admin-table th, .admin-table td { padding: 12px 16px; border: 1px solid var(--border); text-align: left; font-size: 14px; }
    .admin-table th { background: var(--surface); font-weight: 600; }

    /* USER PAGE */
    .user-header { padding: 40px 24px 20px; max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 20px; }
    .user-avatar { width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #c4972a); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #000; flex-shrink: 0; }
    .user-info h1 { font-size: 24px; font-weight: 700; }
    .user-info p { color: var(--muted); font-size: 14px; margin-top: 4px; }
    .user-city { font-size: 12px; color: var(--accent); background: rgba(232,197,71,0.1); padding: 3px 10px; border-radius: 10px; display: inline-block; margin-top: 8px; }

    @media (max-width: 640px) {
      .grid { grid-template-columns: 1fr 1fr; gap: 12px; }
      .post-images { grid-template-columns: 1fr; }
      .hero { padding: 60px 20px 40px; }
    }
    @media (max-width: 400px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <nav>
    <a href="/" class="nav-logo">${lang === 'zh' ? '<span>小</span>黑书' : '<span>X</span>iaoheishu'}</a>
    <div class="nav-spacer"></div>
    <a href="${toggleUrl}" class="lang-btn">${T.langSwitch}</a>
  </nav>
  ${body}
  <footer>
    <p>© 2026 小黑书 Xiaoheishu · ${T.siteTagline} · <a href="https://xiaoheishu.xyz">xiaoheishu.xyz</a></p>
  </footer>
</body>
</html>`
}
