import { ipcMain, BrowserWindow } from 'electron'
import { getDb } from '../db'

function sendStatus(win: BrowserWindow | null, platform: string, status: string, message?: string) {
  win?.webContents.send('publish:status', { platform, status, message, ts: Date.now() })
}

// publish:run — platforms is string[], force is optional string[] of platforms to force re-publish
ipcMain.handle('publish:run', async (_e, postId: number, platforms: string[], force: string[] = []) => {
  const win = BrowserWindow.getFocusedWindow()
  const post = getDb().prepare('SELECT * FROM posts WHERE id = ?').get(postId) as Record<string, unknown>
  if (!post) return { error: 'Post not found' }

  const published: Record<string, { url: string; at: string }> =
    JSON.parse((post.published_platforms as string) || '{}')

  const results: Record<string, string> = {}

  for (const platform of platforms) {
    // Skip if already published and not in force list
    if (published[platform] && !force.includes(platform)) {
      sendStatus(win, platform, 'skipped', `Already published on ${published[platform].at}`)
      results[platform] = 'skipped'
      continue
    }

    sendStatus(win, platform, 'running')
    try {
      const { publish } = await import(`../publishers/${platform}`)
      const result = await publish(post)
      results[platform] = result.url || 'ok'
      sendStatus(win, platform, 'done', result.url)

      // Record successful publish
      published[platform] = { url: result.url || '', at: new Date().toISOString() }
      getDb().prepare('UPDATE posts SET published_platforms=? WHERE id=?')
        .run(JSON.stringify(published), postId)
    } catch (err) {
      results[platform] = 'error'
      sendStatus(win, platform, 'error', (err as Error).message)
    }
  }

  return results
})
