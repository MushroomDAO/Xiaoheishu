import { useState } from 'react'
import type { Post } from '../App'

const PLATFORMS = [
  { id: 'xiaoheishu', label: '小黑书 (xiaoheishu.xyz)', desc: '自有平台，搜索引擎友好' },
  { id: 'wechat', label: '微信公众号', desc: '官方 API，限 1篇/天' },
  { id: 'xiaohongshu', label: '小红书', desc: '需 Chrome 以 debug 模式运行' },
] as const

type StatusMap = Record<string, 'idle' | 'running' | 'done' | 'error'>

export default function Publish({ post }: { post: Post }) {
  const [selected, setSelected] = useState<string[]>(['xiaoheishu'])
  const [status, setStatus] = useState<StatusMap>({})
  const [publishing, setPublishing] = useState(false)

  window.xhs.publishStatus((s: unknown) => {
    const { platform, status: st } = s as { platform: string; status: string }
    setStatus(prev => ({ ...prev, [platform]: st as StatusMap[string] }))
  })

  async function run() {
    if (!post.id) return
    setPublishing(true)
    const init: StatusMap = {}
    selected.forEach(p => { init[p] = 'idle' })
    setStatus(init)
    await window.xhs.publish(post.id, selected)
    setPublishing(false)
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">发布：{post.title}</span>
        <button className="btn btn-primary" onClick={run} disabled={publishing || selected.length === 0}>
          {publishing ? '发布中…' : `发布到 ${selected.length} 个平台`}
        </button>
      </div>
      <div className="content">
        <div className="publish-panel" style={{ maxWidth: 560 }}>
          {PLATFORMS.map(p => (
            <div key={p.id} className="platform-row">
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={e => setSelected(prev =>
                  e.target.checked ? [...prev, p.id] : prev.filter(x => x !== p.id)
                )}
                style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
              />
              <div className="platform-name">
                <div>{p.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.desc}</div>
              </div>
              <div className={`status-dot ${status[p.id] || ''}`} />
              {status[p.id] === 'done' && (
                <span style={{ fontSize: 12, color: '#4ade80' }}>✓</span>
              )}
              {status[p.id] === 'error' && (
                <span style={{ fontSize: 12, color: '#f87171' }}>✗</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: 16, background: 'var(--surface)', borderRadius: 8, maxWidth: 560 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>小红书发布前置条件</p>
          <code style={{ fontSize: 12, color: 'var(--text)', display: 'block', lineHeight: 1.8 }}>
            open -a "Google Chrome" --args --remote-debugging-port=9222
          </code>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
            确保 Chrome 已登录小红书创作者后台，再点发布
          </p>
        </div>
      </div>
    </>
  )
}
