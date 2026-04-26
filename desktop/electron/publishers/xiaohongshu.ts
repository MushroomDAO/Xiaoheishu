import { chromium, type Cookie } from 'playwright'
import path from 'path'
import fs from 'fs'
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

// ── CDP probe ────────────────────────────────────────────────────────────────

export async function probeCdp(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/json/version`, {
      signal: AbortSignal.timeout(1500),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Publishing core ──────────────────────────────────────────────────────────

async function doPublish(page: import('playwright').Page, post: Record<string, unknown>): Promise<string> {
  await page.goto('https://creator.xiaohongshu.com/publish/publish?source=official', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  if (page.url().includes('/login')) throw new Error('NOT_LOGGED_IN')

  // Wait for upload area, then click "上传图文" tab (same as MCP mustClickPublishTab)
  await page.locator('div.upload-content').waitFor({ timeout: 15000 })
  await page.waitForTimeout(500)

  const tabs = page.locator('div.creator-tab')
  const tabCount = await tabs.count()
  for (let i = 0; i < tabCount; i++) {
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

  // Upload images one by one (first uses .upload-input, rest use input[type="file"])
  for (let i = 0; i < imagePaths.length; i++) {
    const selector = i === 0 ? '.upload-input' : 'input[type="file"]'
    await page.locator(selector).first().setInputFiles(imagePaths[i])
    await page.waitForFunction(
      `document.querySelectorAll('.img-preview-area .pr').length >= ${i + 1}`,
      { timeout: 60000 }
    )
    await page.waitForTimeout(500)
  }

  await page.locator('div.d-input input').first().fill(String(post.title || ''))
  await page.waitForTimeout(500)

  await page.locator('div.ql-editor, [role="textbox"]').first().fill(String(post.content || ''))
  await page.waitForTimeout(1000)

  await page.locator('.publish-page-publish-btn button.bg-red').first().click()
  await page.waitForTimeout(3000)

  return page.url()
}

// ── Advanced mode: connect to already-running Chrome via CDP ─────────────────
// Chrome must be pre-launched with --remote-debugging-port from Settings UI.

async function publishViaCdp(
  post: Record<string, unknown>,
  port: number,
): Promise<{ url: string }> {
  if (!(await probeCdp(port))) {
    throw new Error(
      `CDP_NOT_READY:${port}`
    )
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
      throw new Error('小红书 not logged in — please open creator.xiaohongshu.com in that Chrome and log in first.')
    }
    throw err
  } finally {
    await page.close()
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
    await page.goto('https://creator.xiaohongshu.com/publish/publish', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    if (page.url().includes('/login')) {
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
  const { xiaohongshu_advanced_mode, xiaohongshu_cdp_port } = loadSettings()
  const port = parseInt(xiaohongshu_cdp_port || '9222', 10)

  if (xiaohongshu_advanced_mode === 'true') {
    try {
      return await publishViaCdp(post, port)
    } catch (err) {
      const msg = (err as Error).message
      if (msg.startsWith('CDP_NOT_READY:')) {
        throw new Error(
          `Chrome is not running with debug port ${port}.\n` +
          `Go to Settings → 小红书 → click "Launch Chrome with Debug Port" first.`
        )
      }
      // not-logged-in and other actionable errors: re-throw without fallback
      if (msg.includes('not logged in')) throw err
      console.warn(`[xiaohongshu] CDP publish failed (${msg}), falling back to cookies`)
    }
  }

  return publishViaCookies(post)
}
