import { ipcMain } from 'electron'
import { getDb } from '../db'

ipcMain.handle('posts:list', () => {
  return getDb().prepare('SELECT * FROM posts ORDER BY updated_at DESC').all()
})

ipcMain.handle('posts:get', (_e, id: number) => {
  return getDb().prepare('SELECT * FROM posts WHERE id = ?').get(id)
})

ipcMain.handle('posts:save', (_e, post: Record<string, unknown>) => {
  const db = getDb()
  if (post.id) {
    db.prepare(`
      UPDATE posts SET title=?, title_en=?, content=?, content_en=?,
      city=?, tags=?, cover_image=?, updated_at=datetime('now')
      WHERE id=?
    `).run(post.title, post.title_en, post.content, post.content_en,
           post.city, post.tags, post.cover_image, post.id)
    return post.id
  }
  const result = db.prepare(`
    INSERT INTO posts (title, title_en, content, content_en, city, tags, cover_image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(post.title, post.title_en, post.content, post.content_en,
         post.city, post.tags ?? '[]', post.cover_image ?? null)
  return result.lastInsertRowid
})

ipcMain.handle('posts:delete', (_e, id: number) => {
  getDb().prepare('DELETE FROM posts WHERE id = ?').run(id)
})
