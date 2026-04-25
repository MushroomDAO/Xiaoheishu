import type { Env, User, Post, Lang } from '../types'
import { i18n } from '../lib/i18n'
import { layout } from '../lib/layout'
import { hashPassword, verifyPassword, getSessionToken, getAuthFromCookie, parseSession } from '../lib/auth'

const ADMIN_USERNAME = 'admin'

export async function adminPage(request: Request, env: Env, lang: Lang): Promise<Response> {
  const url = new URL(request.url)
  const T = i18n(lang)
  const cookieHeader = request.headers.get('Cookie')
  const token = getAuthFromCookie(cookieHeader)
  const session = token ? parseSession(token) : null
  const authed = session?.username === ADMIN_USERNAME

  // Login POST
  if (request.method === 'POST' && !authed) {
    const form = await request.formData()
    const pw = form.get('password') as string
    const adminUser = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(ADMIN_USERNAME).first<User & { password_hash: string }>()
    if (!adminUser || !await verifyPassword(pw, (adminUser as any).password_hash)) {
      return adminLogin(url, lang, T, 'Wrong password')
    }
    const sessionToken = getSessionToken(ADMIN_USERNAME, env.SESSION_SECRET || 'default')
    return new Response('', {
      status: 302,
      headers: {
        Location: `/admin${lang === 'en' ? '?lang=en' : ''}`,
        'Set-Cookie': `xhs_session=${sessionToken}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
      }
    })
  }

  if (!authed) return adminLogin(url, lang, T)

  // Add user POST
  if (request.method === 'POST' && url.searchParams.get('action') === 'add-user') {
    const form = await request.formData()
    const username = form.get('username') as string
    const displayName = form.get('display_name') as string
    const password = form.get('password') as string
    const city = form.get('city') as string
    const hash = await hashPassword(password)
    await env.DB.prepare(
      'INSERT OR IGNORE INTO users (username, display_name, password_hash, city) VALUES (?, ?, ?, ?)'
    ).bind(username, displayName, hash, city || null).run()
    return new Response('', { status: 302, headers: { Location: `/admin${lang === 'en' ? '?lang=en' : ''}` } })
  }

  // Change password POST
  if (request.method === 'POST' && url.searchParams.get('action') === 'change-password') {
    const form = await request.formData()
    const username = form.get('username') as string
    const newPassword = form.get('new_password') as string
    const hash = await hashPassword(newPassword)
    await env.DB.prepare('UPDATE users SET password_hash = ? WHERE username = ?').bind(hash, username).run()
    return new Response('', { status: 302, headers: { Location: `/admin${lang === 'en' ? '?lang=en' : ''}` } })
  }

  // Admin panel
  const users = await env.DB.prepare('SELECT * FROM users ORDER BY created_at DESC').all<User>()
  const posts = await env.DB.prepare(`
    SELECT p.*, u.username FROM posts p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC LIMIT 50
  `).all<Post & { username: string }>()

  const usersHtml = (users.results || []).map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.display_name}</td>
      <td>${u.city || '-'}</td>
      <td>${u.created_at.split('T')[0]}</td>
      <td>
        <form method="POST" action="/admin?action=change-password${lang === 'en' ? '&lang=en' : ''}" style="display:flex;gap:8px">
          <input type="hidden" name="username" value="${u.username}">
          <input type="password" name="new_password" placeholder="New password" style="width:160px;padding:6px 10px">
          <button type="submit" style="background:var(--accent);color:#000;border:none;padding:6px 14px;border-radius:6px;cursor:pointer">Change</button>
        </form>
      </td>
    </tr>`).join('')

  const postsHtml = (posts.results || []).map(p => `
    <tr>
      <td>${p.username}</td>
      <td><a href="https://${p.username}.xiaoheishu.xyz/${p.slug}" style="color:var(--accent)">${p.title.slice(0, 40)}${p.title.length > 40 ? '...' : ''}</a></td>
      <td>${p.city || '-'}</td>
      <td>${p.published ? '✓' : '—'}</td>
      <td>${p.created_at.split('T')[0]}</td>
    </tr>`).join('')

  const body = `
  <div class="admin-container">
    <h1 style="margin-bottom:32px">${T.adminTitle}</h1>

    <h2 style="margin-bottom:16px">${T.adminAddUser}</h2>
    <form method="POST" action="/admin?action=add-user${lang === 'en' ? '&lang=en' : ''}" style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:40px;align-items:flex-end">
      <div><label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Username</label><input name="username" placeholder="sunshine" style="width:140px"></div>
      <div><label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Display Name</label><input name="display_name" placeholder="Sunshine" style="width:140px"></div>
      <div><label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">City</label><input name="city" placeholder="Tianjin" style="width:120px"></div>
      <div><label style="display:block;font-size:13px;color:var(--muted);margin-bottom:4px">Password</label><input name="password" type="password" style="width:160px"></div>
      <button type="submit" class="btn-primary">${T.adminAddUser}</button>
    </form>

    <h2 style="margin-bottom:16px">${T.adminUsers}</h2>
    <table class="admin-table">
      <thead><tr><th>Username</th><th>Name</th><th>City</th><th>Joined</th><th>Password</th></tr></thead>
      <tbody>${usersHtml}</tbody>
    </table>

    <h2 style="margin:40px 0 16px">${T.adminPosts}</h2>
    <table class="admin-table">
      <thead><tr><th>Author</th><th>Title</th><th>City</th><th>Published</th><th>Date</th></tr></thead>
      <tbody>${postsHtml}</tbody>
    </table>
  </div>`

  return new Response(layout({ title: T.adminTitle, lang, url, body }), { headers: { 'Content-Type': 'text/html;charset=UTF-8' } })
}

function adminLogin(url: URL, lang: Lang, T: ReturnType<typeof i18n>, error?: string): Response {
  const body = `
  <div class="form-container">
    <h1 class="form-title">${T.adminTitle}</h1>
    ${error ? `<p style="color:#f87171;margin-bottom:16px">${error}</p>` : ''}
    <form method="POST">
      <div class="form-group"><label>${T.uploadPassword}</label><input name="password" type="password" required autofocus></div>
      <button type="submit" class="form-submit">${T.uploadLogin}</button>
    </form>
  </div>`
  return new Response(layout({ title: T.adminTitle, lang, url, body }), { status: error ? 401 : 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } })
}
