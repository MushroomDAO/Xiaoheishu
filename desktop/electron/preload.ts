import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('xhs', {
  // Posts CRUD
  listPosts: () => ipcRenderer.invoke('posts:list'),
  getPost: (id: number) => ipcRenderer.invoke('posts:get', id),
  savePost: (post: unknown) => ipcRenderer.invoke('posts:save', post),
  deletePost: (id: number) => ipcRenderer.invoke('posts:delete', id),

  // Publishing
  publish: (postId: number, platforms: string[]) =>
    ipcRenderer.invoke('publish:run', postId, platforms),
  publishStatus: (callback: (status: unknown) => void) =>
    ipcRenderer.on('publish:status', (_e, status) => callback(status)),
})
