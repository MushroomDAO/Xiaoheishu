export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `sha256:${hex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const computed = await hashPassword(password)
  return computed === stored
}

export function getSessionToken(username: string, secret: string): string {
  const payload = btoa(JSON.stringify({ username, exp: Date.now() + 86400000 }))
  return payload
}

export function parseSession(token: string): { username: string } | null {
  try {
    const { username, exp } = JSON.parse(atob(token))
    if (Date.now() > exp) return null
    return { username }
  } catch {
    return null
  }
}

export function getAuthFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/xhs_session=([^;]+)/)
  return match ? match[1] : null
}
