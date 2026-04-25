// 小红书发布 — 通过 CDP 连接用户已有 Chrome Profile
// 用户需要提前以 --remote-debugging-port=9222 启动 Chrome

import { chromium } from 'playwright'

export async function publish(post: Record<string, unknown>) {
  // Connect to user's existing Chrome (already logged into 小红书)
  const browser = await chromium.connectOverCDP('http://localhost:9222')
  const context = browser.contexts()[0]
  if (!context) throw new Error('No Chrome context found. Is Chrome running with --remote-debugging-port=9222?')

  const page = await context.newPage()
  try {
    await page.goto('https://creator.xiaohongshu.com/publish/publish', { waitUntil: 'networkidle' })

    // Upload cover image if available
    if (post.cover_image) {
      const fileInput = page.locator('input[type=file]').first()
      await fileInput.setInputFiles(String(post.cover_image))
      await page.waitForTimeout(2000)
    }

    // Fill title
    await page.locator('.d-title input, [placeholder*="标题"]').first()
      .fill(String(post.title), { delay: 80 })
    await page.waitForTimeout(500 + Math.random() * 1000)

    // Fill content (simplified — actual XHS editor is complex)
    await page.locator('.c-input-inner, [placeholder*="正文"]').first()
      .fill(String(post.content), { delay: 30 })
    await page.waitForTimeout(1000 + Math.random() * 2000)

    // Publish
    await page.locator('button:has-text("发布"), button:has-text("提交")').last().click()
    await page.waitForTimeout(3000)

    const url = page.url()
    return { url }
  } finally {
    await page.close()
  }
}
