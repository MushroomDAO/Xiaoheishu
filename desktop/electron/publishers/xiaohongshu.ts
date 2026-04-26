import { chromium, type Cookie } from 'playwright'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { app } from 'electron'
import { loadSettings } from '../settings'

// ── Cookie persistence (default mode) ───────────────────────────────────────

function cookiesPath() {
  return path.join(app.getPath('userData'), 'xiaohongshu_cookies.json')
}

export function hasCookies(): boolean {
  return fs.existsSync(cookiesPath())
}

function loadCookies(): Cookie[] {
  try { return JSON.parse(fs.readFileSync(cookiesPath(), 'utf-8')) as Cookie[] }
  catch { return [] }
}

function saveCookies(cookies: Cookie[]) {
  fs.writeFileSync(cookiesPath(), JSON.stringify(cookies, null, 2))
}

// ── CDP helpers ──────────────────────────────────────────────────────────────

async function probeCdp(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/json/version`, {
      signal: AbortSignal.timeout(1000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function waitForCdp(port: number, timeoutMs = 30000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await probeCdp(port)) return
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error(`Chrome CDP port ${port} not ready after ${timeoutMs / 1000}s`)
}

// ── Publishing core ──────────────────────────────────────────────────────────

async function doPublish(page: import('playwright').Page, post: Record<string, unknown>): Promise<string> {
  await page.goto('https://creator.xiaohongshu.com/publish/publish', { waitUntil: 'networkidle' })

  const needLogin = await page.locator('.login-container').isVisible({ timeout: 3000 }).catch(() => false)
  if (needLogin) throw new Error('NOT_LOGGED_IN')

  if (post.cover_image) {
    await page.locator('.upload-input').first().setInputFiles(String(post.cover_image))
    await page.waitForTimeout(2000)
  }

  await page.locator('div.d-input input').first().fill(String(post.title))
  await page.waitForTimeout(500)

  await page.locator('div.ql-editor, [role="textbox"]').first().fill(String(post.content))
  await page.waitForTimeout(1000)

  await page.locator('.publish-page-publish-btn button.bg-red').first().click()
  await page.waitForTimeout(3000)

  return page.url()
}

// ── Advanced mode: launch user's Chrome with profile + CDP ──────────────────

async function publishViaCdp(
  post: Record<string, unknown>,
  profileDir: string,
  port: number,
): Promise<{ url: string }> {
  const resolvedProfile = profileDir.replace(/^~/, os.homedir())

  // Launch Chrome with the specified profile and debug port if not already running
  if (!(await probeCdp(port))) {
    execSync(
      `open -na "Google Chrome" --args` +
      ` --user-data-dir="${resolvedProfile}"` +
      ` --remote-debugging-port=${port}` +
      ` --no-first-run` +
      ` --no-default-browser-check`,
    )
    await waitForCdp(port, 30000)
  }

  const browser = await chromium.connectOverCDP(`http://localhost:${port}`)
  const context = browser.contexts()[0]
  if (!context) throw new Error('No browser context found via CDP')

  const page = await context.newPage()
  try {
    const url = await doPublish(page, post)
    return { url }
  } catch (err) {
    if ((err as Error).message === 'NOT_LOGGED_IN') {
      throw new Error('小红书 not logged in in this Chrome profile. Please log in manually first.')
    }
    throw err
  } finally {
    await page.close()
    // Never close the browser — it's the user's Chrome
  }
}

// ── Default mode: Playwright Chromium + saved cookies ───────────────────────

async function publishViaCookies(post: Record<string, unknown>): Promise<{ url: string }> {
  const saved = loadCookies()
  if (saved.length === 0) {
    throw new Error('小红书 not logged in — go to Settings → 小红书 → Login via QR Code')
  }

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  await context.addCookies(saved)

  const page = await context.newPage()
  try {
    const url = await doPublish(page, post)
    saveCookies(await context.cookies())
    return { url }
  } catch (err) {
    if ((err as Error).message === 'NOT_LOGGED_IN') {
      throw new Error('小红书 session expired — please re-login in Settings')
    }
    throw err
  } finally {
    await page.close()
    await context.close()
    await browser.close()
  }
}

// ── QR login (default mode only) ─────────────────────────────────────────────

export async function loginWithQR(): Promise<void> {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    // Go directly to creator platform — it will redirect to its own login page if not authed.
    // After QR scan we land back on publish/publish, so creator-domain session cookies are set.
    await page.goto('https://creator.xiaohongshu.com/publish/publish', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // If already on publish page (not redirected to login), we're already logged in
    const onLoginPage = page.url().includes('/login')
    if (onLoginPage) {
      // Wait until redirected back to publish page after successful QR scan (up to 4 min)
      await page.waitForURL(/creator\.xiaohongshu\.com\/publish\/publish/, { timeout: 240000 })
      await page.waitForTimeout(3000)
    }

    // Save cookies — creator.xiaohongshu.com session is now included
    saveCookies(await context.cookies())
  } finally {
    await page.close()
    await context.close()
    await browser.close()
  }
}

// ── Public publish entry point ────────────────────────────────────────────────

export async function publish(post: Record<string, unknown>): Promise<{ url: string }> {
  const { xiaohongshu_advanced_mode, xiaohongshu_cdp_port, xiaohongshu_profile_dir } = loadSettings()
  const port = parseInt(xiaohongshu_cdp_port || '9222', 10)

  if (xiaohongshu_advanced_mode === 'true') {
    if (!xiaohongshu_profile_dir) {
      console.warn('[xiaohongshu] Advanced mode enabled but no profile dir set — falling back to cookies')
    } else {
      try {
        return await publishViaCdp(post, xiaohongshu_profile_dir, port)
      } catch (err) {
        console.warn(`[xiaohongshu] CDP publish failed (${(err as Error).message}), falling back to cookies`)
      }
    }
  }

  return publishViaCookies(post)
}
