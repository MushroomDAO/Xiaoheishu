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

  // 小红书 default: QR login → cookies.json
  // Advanced mode: launch user's Chrome with specific profile + CDP port
  xiaohongshu_advanced_mode: string   // 'true' | ''
  xiaohongshu_cdp_port: string        // default '9222'
  xiaohongshu_profile_dir: string     // full path to Chrome profile dir, e.g. ~/...Chrome/Profile 4
}

const DEFAULTS: AppSettings = {
  xhs_username: '',
  xhs_password: '',
  wechat_app_id: '',
  wechat_app_secret: '',
  wechat_mpid: '',
  xiaohongshu_advanced_mode: '',
  xiaohongshu_cdp_port: '9222',
  xiaohongshu_profile_dir: '',
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
