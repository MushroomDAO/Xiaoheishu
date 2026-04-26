import { useState, useEffect } from 'react'
import type { Post } from '../App'

const PLATFORMS = [
  { id: 'xiaoheishu', label: '小黑书 (xiaoheishu.xyz)', desc: '自有平台，搜索引擎友好' },
  { id: 'wechat',     label: '微信公众号',               desc: '官方 API，限 1篇/天' },
  { id: 'xiaohongshu',label: '小红书',                   desc: 'Cookie session · advanced: connects to Chrome debug port' },
] as const

type RunStatus = 'idle' | 'running' | 'done' | 'error' | 'skipped'
type StatusMap = Record<string, RunStatus>
type PubRecord = Record<string, { url: string; at: string }>

function parsePubRecord(raw?: string): PubRecord {
  try { return raw ? JSON.parse(raw) as PubRecord : {} } catch { return {} }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Publish({ post }: { post: Post }) {
  const pubRecord = parsePubRecord(post.published_platforms)

  // Default: only select platforms NOT yet published
  const [selected, setSelected] = useState<string[]>(
    PLATFORMS.map(p => p.id).filter(id => !pubRecord[id])
  )
  // Force set: platforms user explicitly decided to re-publish
  const [forced, setForced] = useState<string[]>([])
  const [status, setStatus] = useState<StatusMap>({})
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    window.xhs.publishStatus((s: unknown) => {
      const { platform, status: st, message } = s as { platform: string; status: string; message?: string }
      setStatus(prev => ({ ...prev, [platform]: st as RunStatus }))
      if (message) setMessages(prev => ({ ...prev, [platform]: message }))
    })
  }, [])

  function togglePlatform(id: string, checked: boolean) {
    if (checked) {
      setSelected(prev => [...prev, id])
      // If already published, automatically mark as forced
      if (pubRecord[id]) setForced(prev => [...prev, id])
    } else {
      setSelected(prev => prev.filter(x => x !== id))
      setForced(prev => prev.filter(x => x !== id))
    }
  }

  async function run() {
    if (!post.id) return
    setPublishing(true)
    const init: StatusMap = {}
    selected.forEach(p => { init[p] = 'idle' })
    setStatus(init)
    setMessages({})
    await window.xhs.publish(post.id, selected, forced)
    setPublishing(false)
  }

  const pendingCount = selected.filter(id => !pubRecord[id] || forced.includes(id)).length

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Publish: {post.title}</span>
        <button
          className="btn btn-primary"
          onClick={run}
          disabled={publishing || selected.length === 0}
        >
          {publishing
            ? 'Publishing…'
            : pendingCount === 0
              ? 'Nothing new to publish'
              : `Publish to ${pendingCount} platform${pendingCount > 1 ? 's' : ''}`}
        </button>
      </div>

      <div className="content">
        <div style={{ maxWidth: 560 }}>
          {PLATFORMS.map(p => {
            const rec = pubRecord[p.id]
            const st = status[p.id]
            const isForced = forced.includes(p.id)
            const isSelected = selected.includes(p.id)

            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px', marginBottom: 8,
                background: 'var(--surface)', borderRadius: 10,
                border: `1px solid ${st === 'done' ? '#4ade80' : st === 'error' ? '#f87171' : st === 'skipped' ? 'var(--accent)' : 'var(--border)'}`,
                opacity: !isSelected && !rec ? 0.6 : 1,
              }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={e => togglePlatform(p.id, e.target.checked)}
                  disabled={publishing}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16, marginTop: 2, flexShrink: 0 }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500, fontSize: 14 }}>{p.label}</span>
                    {rec && !st && (
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 100,
                        background: '#4ade8020', color: '#4ade80', fontWeight: 600,
                      }}>已发布</span>
                    )}
                    {isForced && (
                      <span style={{
                        fontSize: 10, padding: '1px 7px', borderRadius: 100,
                        background: '#f8717120', color: '#f87171', fontWeight: 600,
                      }}>重发</span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{p.desc}</div>

                  {/* Published record */}
                  {rec && !st && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                      Last published {fmtDate(rec.at)}
                      {rec.url && (
                        <> · <a href={rec.url} target="_blank" style={{ color: 'var(--accent)' }}>view</a></>
                      )}
                    </div>
                  )}

                  {/* Re-publish warning */}
                  {isForced && !st && (
                    <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>
                      Will create a duplicate post on this platform.
                    </div>
                  )}

                  {/* Run-time status */}
                  {st === 'running' && (
                    <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>Publishing…</div>
                  )}
                  {st === 'done' && (
                    <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>
                      ✓ Done{messages[p.id] ? <> · <a href={messages[p.id]} target="_blank" style={{ color: '#4ade80' }}>view</a></> : ''}
                    </div>
                  )}
                  {st === 'error' && (
                    <div style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>
                      ✗ {messages[p.id] || 'Failed'}
                    </div>
                  )}
                  {st === 'skipped' && (
                    <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>
                      ↩ Skipped — already published
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {Object.keys(pubRecord).length > 0 && selected.some(id => pubRecord[id]) && (
            <div style={{
              marginTop: 8, padding: '10px 14px', borderRadius: 8,
              background: '#f8717110', border: '1px solid #f8717140',
              fontSize: 12, color: '#f87171',
            }}>
              ⚠ Some selected platforms were already published. Continuing will create duplicate posts.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
