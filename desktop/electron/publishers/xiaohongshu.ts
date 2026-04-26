import { chromium, type Cookie } from 'playwright'
import { execSync, spawnSync } from 'child_process'
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

function isChromeRunning(): boolean {
  const result = spawnSync('pgrep', ['-x', 'Google Chrome'], { encoding: 'utf-8' })
  return result.status === 0 && result.stdout.trim().length > 0
}

// ── Publishing core ──────────────────────────────────────────────────────────

async function doPublish(page: import('playwright').Page, post: Record<string, unknown>): Promise<string> {
  await page.goto('https://creator.xiaohongshu.com/publish/publish?source=official', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // Check for login redirect
  if (page.url().includes('/login')) throw new Error('NOT_LOGGED_IN')

  // Wait for the upload-content area, then click the "上传图文" tab
  await page.locator('div.upload-content').waitFor({ timeout: 15000 })
  await page.waitForTimeout(500)

  // Click "上传图文" tab (text-based, same as MCP's mustClickPublishTab)
  const tabs = page.locator('div.creator-tab')
  const count = await tabs.count()
  for (let i = 0; i < count; i++) {
    const tab = tabs.nth(i)
    const text = (await tab.textContent() || '').trim()
    if (text === '上传图文') {
      await tab.click()
      break
    }
  }
  await page.waitForTimeout(1000)

  // Collect images: use post.images array first, fall back to cover_image
  let imagePaths: string[] = []
  try {
    const arr = JSON.parse(String(post.images || '[]')) as string[]
    if (arr.length > 0) imagePaths = arr
  } catch { /* ignore */ }
  if (imagePaths.length === 0 && post.cover_image) {
    imagePaths = [String(post.cover_image)]
  }

  if (imagePaths.length === 0) {
    throw new Error('小红书 requires at least one image — please add images in the editor')
  }

  // Upload images one by one (MCP pattern: first uses .upload-input, rest use input[type="file"])
  for (let i = 0; i < imagePaths.length; i++) {
    const selector = i === 0 ? '.upload-input' : 'input[type="file"]'
    await page.locator(selector).first().setInputFiles(imagePaths[i])
    // Wait for upload preview to appear
    await page.waitForFunction(
      (n: number) => document.querySelectorAll('.img-preview-area .pr').length >= n,
      i + 1,
      { timeout: 60000 }
    )
    await page.waitForTimeout(500)
  }

  // Fill title
  await page.locator('div.d-input input').first().fill(String(post.title || ''))
  await page.waitForTimeout(500)

  // Fill content
  await page.locator('div.ql-editor, [role="textbox"]').first().fill(String(post.content || ''))
  await page.waitForTimeout(1000)

  // Click publish button
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

  if (!(await probeCdp(port))) {
    // If Chrome is already running without the debug port, profile will be locked
    if (isChromeRunning()) {
      throw new Error(
        'Chrome is already running without a debug port.\n' +
        'Please close Chrome first, then try publishing again — the app will relaunch it with the correct profile and debug port.'
      )
    }
    execSync(
      `open -a "Google Chrome" --args` +
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
      throw new Error('小红书 not logged in in this Chrome profile. Please open creator.xiaohongshu.com and log in first.')
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
    // Go directly to creator platform — it redirects to its own QR login page if not authed.
    // After QR scan it redirects back to publish/publish, so creator-domain session is set.
    await page.goto('https://creator.xiaohongshu.com/publish/publish', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
      // Wait until redirected back to publish page after successful QR scan (up to 4 min)
      await page.waitForURL(/creator\.xiaohongshu\.com\/publish\/publish/, { timeout: 240000 })
      await page.waitForTimeout(3000)
    }

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
        const msg = (err as Error).message
        // Don't silently fall back if the error is actionable (Chrome running, not logged in)
        if (msg.includes('Chrome is already running') || msg.includes('not logged in')) {
          throw err
        }
        console.warn(`[xiaohongshu] CDP publish failed (${msg}), falling back to cookies`)
      }
    }
  }

  return publishViaCookies(post)
}
