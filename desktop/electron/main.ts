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
import { spawnSync, spawn } from 'child_process'
import os from 'os'

ipcMain.handle('xiaohongshu:login', async () => {
  await loginWithQR()
  return { ok: true }
})

ipcMain.handle('xiaohongshu:login-status', () => {
  return { loggedIn: hasCookies() }
})

ipcMain.handle('xiaohongshu:cdp-status', async (_e, port: number) => {
  return { connected: await probeCdp(port) }
})

ipcMain.handle('xiaohongshu:launch-chrome', async (_e, profileDir: string, port: number) => {
  const resolved = profileDir.replace(/^~/, os.homedir())
  const chromeBin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

  // Kill Chrome and wait until fully exited (profile dir is locked while running)
  spawnSync('pkill', ['-x', 'Google Chrome'], { encoding: 'utf-8' })
  const killDeadline = Date.now() + 5000
  while (Date.now() < killDeadline) {
    const alive = spawnSync('pgrep', ['-x', 'Google Chrome'], { encoding: 'utf-8' })
    if (alive.status !== 0) break
    await new Promise(r => setTimeout(r, 300))
  }

  // --user-data-dir = Chrome root (parent of all profiles)
  // --profile-directory = the specific profile folder name inside that root
  const userDataDir = path.dirname(resolved)      // e.g. .../Google/Chrome
  const profileFolder = path.basename(resolved)   // e.g. Default, Profile 4

  spawn(chromeBin, [
    `--user-data-dir=${userDataDir}`,
    `--profile-directory=${profileFolder}`,
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    'https://creator.xiaohongshu.com/publish/publish?source=official',
  ], { detached: true, stdio: 'ignore' }).unref()

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
