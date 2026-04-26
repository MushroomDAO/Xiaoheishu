import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export interface AppSettings {
  // 小黑书 xiaoheishu.xyz
  xhs_username: string
  xhs_password: string

  // 微信公众号
  wechat_app_id: string
  wechat_app_secret: string
  wechat_mpid: string

  // 小红书 default mode: QR login → cookies.json (Playwright Chromium)
  // Advanced mode: dedicated Chrome at ~/.xiaoheishu/chrome-profile + CDP port
  // (Chrome 136+ silently disables CDP on the default profile, so we use a
  //  separate user-data-dir managed by the LaunchAgent — no profile picker.)
  xiaohongshu_advanced_mode: string   // 'true' | ''
  xiaohongshu_cdp_port: string        // default '9222'
}

const DEFAULTS: AppSettings = {
  xhs_username: '',
  xhs_password: '',
  wechat_app_id: '',
  wechat_app_secret: '',
  wechat_mpid: '',
  xiaohongshu_advanced_mode: '',
  xiaohongshu_cdp_port: '9222',
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function loadSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf-8')
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = loadSettings()
  const updated = { ...current, ...settings }
  fs.writeFileSync(getSettingsPath(), JSON.stringify(updated, null, 2))
  return updated
}
