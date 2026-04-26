import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { loadSettings } from '../settings'

const execFileAsync = promisify(execFile)

export async function publish(post: Record<string, unknown>) {
  const { wechat_app_id, wechat_app_secret, wechat_mpid } = loadSettings()

  if (!wechat_app_id || !wechat_app_secret) {
    throw new Error('WeChat credentials not configured — go to Settings → 微信公众号')
  }

  const pipelinePath = path.resolve(__dirname, '../../../../pipeline/m2/publish.js')

  const { stdout } = await execFileAsync('node', [
    pipelinePath,
    '--title', String(post.title),
    '--content', String(post.content),
  ], {
    env: {
      ...process.env,
      WECHAT_APP_ID: wechat_app_id,
      WECHAT_APP_SECRET: wechat_app_secret,
      WECHAT_MEDIA_PLATFORM_ID: wechat_mpid,
    },
    timeout: 60000,
  })

  const result = JSON.parse(stdout) as { url?: string }
  return { url: result.url || '' }
}
