// WeChat 公众号发布 — 复用 blog/pipeline/m2/ 逻辑
// Requires env: WECHAT_APP_ID, WECHAT_APP_SECRET, WECHAT_MEDIA_PLATFORM_ID

import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execFileAsync = promisify(execFile)

export async function publish(post: Record<string, unknown>) {
  // Delegate to existing Node.js pipeline script
  // blog/pipeline/m2/publish.js accepts --title --content --author args
  const pipelinePath = path.resolve(__dirname, '../../../../blog/pipeline/m2/publish.js')

  const { stdout } = await execFileAsync('node', [
    pipelinePath,
    '--title', String(post.title),
    '--content', String(post.content),
  ], {
    env: {
      ...process.env,
      WECHAT_APP_ID: process.env.WECHAT_APP_ID,
      WECHAT_APP_SECRET: process.env.WECHAT_APP_SECRET,
    },
    timeout: 60000,
  })

  const result = JSON.parse(stdout)
  return { url: result.url || '' }
}
