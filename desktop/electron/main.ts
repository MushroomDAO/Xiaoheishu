import { app, BrowserWindow, ipcMain, shell, protocol, net } from 'electron'
import path from 'path'
import fs from 'fs'
import { initDb } from './db'

// Must be called before app.whenReady()
protocol.registerSchemesAsPrivileged([
  { scheme: 'localfile', privileges: { secure: true, standard: false, supportFetchAPI: true, corsEnabled: true } }
])
import { startPreviewServer } from './preview-server'

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  // localfile:///abs/path → file:///abs/path, bypasses Electron CSP for local images
  protocol.handle('localfile', (request) =>
    net.fetch(request.url.replace('localfile://', 'file://'))
  )

  await initDb()
  startPreviewServer(3456)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// IPC handlers registered in separate modules
import './ipc/posts'
import './ipc/publish'

ipcMain.handle('preview:open', (_e, postId: number) => {
  shell.openExternal(`http://localhost:3456/preview/${postId}`)
})

import { getModelsStatus, downloadModel, setActiveModel, extractWithAI } from './ai'

ipcMain.handle('models:status', () => getModelsStatus())

ipcMain.handle('models:download', async (event, modelId: string) => {
  await downloadModel(modelId, progress => {
    event.sender.send('models:download-progress', progress)
  })
})

ipcMain.handle('models:setActive', (_e, modelId: string) => setActiveModel(modelId))

ipcMain.handle('ai:extract', (_e, rawText: string) => extractWithAI(rawText))

import { loadSettings, saveSettings } from './settings'
ipcMain.handle('settings:load', () => loadSettings())
ipcMain.handle('settings:save', (_e, s: Record<string, string>) => saveSettings(s))

import { hasCookies, loginWithQR, probeCdp } from './publishers/xiaohongshu'
import { spawnSync, execSync } from 'child_process'
import os from 'os'

ipcMain.handle('xiaohongshu:login', async () => {
  await loginWithQR()
  return { ok: true }
})

ipcMain.handle('xiaohongshu:login-status', () => {
  return { loggedIn: hasCookies() }
})

ipcMain.handle('xiaohongshu:cdp-status', async (_e, port: number) => {
  const connected = await probeCdp(port)
  // Also check if Chrome process has the debug flag (diagnostic)
  const psResult = spawnSync('sh', ['-c', 'ps aux | grep "remote-debugging" | grep -v grep'], { encoding: 'utf-8' })
  const hasDebugFlag = psResult.stdout.trim().length > 0
  return { connected, hasDebugFlag, debugProcessLine: psResult.stdout.trim().slice(0, 120) }
})

ipcMain.handle('xiaohongshu:chrome-running', () => {
  const r = spawnSync('pgrep', ['-x', 'Google Chrome'], { encoding: 'utf-8' })
  return { running: r.status === 0 }
})

ipcMain.handle('xiaohongshu:launch-chrome', async (_e, profileDir: string, port: number) => {
  const resolved = profileDir.replace(/^~/, os.homedir())

  // Graceful quit first, then wait for clean exit
  spawnSync('osascript', ['-e', 'tell application "Google Chrome" to quit'], { encoding: 'utf-8' })
  const killDeadline = Date.now() + 8000
  while (Date.now() < killDeadline) {
    if (spawnSync('pgrep', ['-f', 'Google Chrome'], { encoding: 'utf-8' }).status !== 0) break
    await new Promise(r => setTimeout(r, 400))
  }
  spawnSync('pkill', ['-9', '-f', 'Google Chrome'], { encoding: 'utf-8' })
  await new Promise(r => setTimeout(r, 1500))

  // Remove SingletonLock/SingletonSocket — left behind by SIGKILL, causes new Chrome to
  // start in "client mode" (connecting to dead instance) and skip binding the debug port
  const chromeRoot = path.dirname(resolved)
  for (const lockFile of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) {
    const p = path.join(chromeRoot, lockFile)
    try { fs.unlinkSync(p) } catch { /* not present, ignore */ }
  }

  // Follow SKILL.md exactly: pass profile dir directly as --user-data-dir
  // (not the Chrome root + --profile-directory). This is how the xhs-mcp CDP skill works.
  const profileDirEsc = resolved.replace(/"/g, '\\"')
  execSync(
    `open -na "Google Chrome" --args` +
    ` --user-data-dir="${profileDirEsc}"` +
    ` --remote-debugging-port=${port}` +
    ` --no-first-run` +
    ` --no-default-browser-check` +
    ` "https://creator.xiaohongshu.com/publish/publish?source=official"`,
    { shell: '/bin/sh' }
  )

  return { ok: true }
})

ipcMain.handle('xiaohongshu:list-profiles', () => {
  const dataDir = path.join(require('os').homedir(), 'Library', 'Application Support', 'Google', 'Chrome')
  const localStatePath = path.join(dataDir, 'Local State')
  try {
    const raw = fs.readFileSync(localStatePath, 'utf-8')
    const state = JSON.parse(raw) as {
      profile?: { info_cache?: Record<string, { name?: string; user_name?: string; gaia_name?: string }> }
    }
    const cache = state.profile?.info_cache ?? {}
    return Object.entries(cache).map(([folder, info]) => ({
      folder,
      fullPath: path.join(dataDir, folder),
      name: info.name || folder,
      email: info.user_name || info.gaia_name || '',
    }))
  } catch {
    return []
  }
})

ipcMain.handle('settings:test-xhs', async (_e, username: string, password: string) => {
  if (!username || !password) throw new Error('Username and password not set')
  const res = await fetch(`https://${username}.xiaoheishu.xyz/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
})

ipcMain.handle('images:save', (_e, bytes: number[], ext: string) => {
  const dir = path.join(app.getPath('userData'), 'images')
  fs.mkdirSync(dir, { recursive: true })
  const filename = `img_${Date.now()}.${ext}`
  const filepath = path.join(dir, filename)
  fs.writeFileSync(filepath, Buffer.from(bytes))
  return filepath
})
