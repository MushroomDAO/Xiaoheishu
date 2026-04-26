import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('xhs', {
  // Posts CRUD
  listPosts: () => ipcRenderer.invoke('posts:list'),
  getPost: (id: number) => ipcRenderer.invoke('posts:get', id),
  savePost: (post: unknown) => ipcRenderer.invoke('posts:save', post),
  deletePost: (id: number) => ipcRenderer.invoke('posts:delete', id),

  // Publishing
  publish: (postId: number, platforms: string[], force?: string[]) =>
    ipcRenderer.invoke('publish:run', postId, platforms, force ?? []),
  publishStatus: (callback: (status: unknown) => void) =>
    ipcRenderer.on('publish:status', (_e, status) => callback(status)),

  // Preview in browser
  openPreview: (postId: number) =>
    ipcRenderer.invoke('preview:open', postId),

  // Model management
  modelsStatus: () => ipcRenderer.invoke('models:status'),
  modelsDownload: (modelId: string, onProgress: (p: { percent: number; downloadedMB: number; totalMB: number }) => void) => {
    const handler = (_e: unknown, p: unknown) => onProgress(p as { percent: number; downloadedMB: number; totalMB: number })
    ipcRenderer.on('models:download-progress', handler)
    return ipcRenderer.invoke('models:download', modelId).finally(() => {
      ipcRenderer.removeListener('models:download-progress', handler)
    })
  },
  modelsSetActive: (modelId: string) => ipcRenderer.invoke('models:setActive', modelId),

  // AI inference
  aiExtract: (rawText: string) => ipcRenderer.invoke('ai:extract', rawText),

  // Image management
  saveImage: (bytes: number[], ext: string) => ipcRenderer.invoke('images:save', bytes, ext),

  // Settings
  settingsLoad: () => ipcRenderer.invoke('settings:load'),
  settingsSave: (s: Record<string, string>) => ipcRenderer.invoke('settings:save', s),
  testXhsConnection: (username: string, password: string) => ipcRenderer.invoke('settings:test-xhs', username, password),
  xiaohongshuLogin: () => ipcRenderer.invoke('xiaohongshu:login'),
  xiaohongshuLoginStatus: () => ipcRenderer.invoke('xiaohongshu:login-status'),
  xiaohongshuCdpStatus: (port: number) => ipcRenderer.invoke('xiaohongshu:cdp-status', port),
  xiaohongshuAgentStatus: () => ipcRenderer.invoke('xiaohongshu:agent-status'),
  xiaohongshuInstallAgent: (port: number) => ipcRenderer.invoke('xiaohongshu:install-agent', port),
  xiaohongshuStartAgent: () => ipcRenderer.invoke('xiaohongshu:start-agent'),
  xiaohongshuUninstallAgent: () => ipcRenderer.invoke('xiaohongshu:uninstall-agent'),
})
