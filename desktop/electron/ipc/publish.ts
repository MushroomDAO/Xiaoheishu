import { ipcMain, BrowserWindow } from 'electron'
import { getDb } from '../db'

function sendStatus(win: BrowserWindow | null, platform: string, status: string, message?: string) {
  win?.webContents.send('publish:status', { platform, status, message, ts: Date.now() })
}

ipcMain.handle('publish:run', async (_e, postId: number, platforms: string[]) => {
  const win = BrowserWindow.getFocusedWindow()
  const post = getDb().prepare('SELECT * FROM posts WHERE id = ?').get(postId) as Record<string, unknown>
  if (!post) return { error: 'Post not found' }

  const results: Record<string, string> = {}

  for (const platform of platforms) {
    sendStatus(win, platform, 'running')
    try {
      const { publish } = await import(`../publishers/${platform}`)
      const result = await publish(post)
      results[platform] = result.url || 'ok'
      sendStatus(win, platform, 'done', result.url)

      // Record published platform
      const existing = JSON.parse((post.published_platforms as string) || '{}')
      existing[platform] = { url: result.url, at: new Date().toISOString() }
      getDb().prepare('UPDATE posts SET published_platforms=? WHERE id=?')
        .run(JSON.stringify(existing), postId)
    } catch (err) {
      results[platform] = 'error'
      sendStatus(win, platform, 'error', (err as Error).message)
    }
  }

  return results
})
