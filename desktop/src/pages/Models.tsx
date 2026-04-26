import { useState, useEffect } from 'react'

interface HardwareInfo {
  totalRAMGB: number
  cpuModel: string
  arch: string
  platform: string
  isAppleSilicon: boolean
}

interface ModelStatus {
  id: string
  name: string
  description: string
  sizeMB: number
  ramRequiredGB: number
  quality: number
  chineseFocus: boolean
  downloaded: boolean
  filepath: string | null
  isRecommended: boolean
  isActive: boolean
}

interface ModelsData {
  hardware: HardwareInfo
  recommended: string
  active: string
  models: ModelStatus[]
}

type DownloadState = { percent: number; downloadedMB: number; totalMB: number }

export default function Models() {
  const [data, setData] = useState<ModelsData | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [progress, setProgress] = useState<DownloadState | null>(null)
  const [error, setError] = useState('')

  async function refresh() {
    const d = await (window as any).xhs.modelsStatus()
    setData(d)
  }

  useEffect(() => { refresh() }, [])

  async function startDownload(modelId: string) {
    setDownloading(modelId)
    setProgress({ percent: 0, downloadedMB: 0, totalMB: 0 })
    setError('')
    try {
      await (window as any).xhs.modelsDownload(modelId, (p: DownloadState) => setProgress(p))
      await refresh()
    } catch (e) {
      setError(String(e))
    } finally {
      setDownloading(null)
      setProgress(null)
    }
  }

  async function setActive(modelId: string) {
    await (window as any).xhs.modelsSetActive(modelId)
    await refresh()
  }

  if (!data) return (
    <>
      <div className="topbar"><span className="topbar-title">AI Models</span></div>
      <div className="content"><p style={{ color: 'var(--muted)' }}>Loading…</p></div>
    </>
  )

  const { hardware: hw, models } = data

  const platformLabel = hw.isAppleSilicon
    ? 'Apple Silicon'
    : hw.platform === 'darwin' ? 'macOS Intel' : hw.platform === 'win32' ? 'Windows' : 'Linux'

  const fits = (m: ModelStatus) => m.ramRequiredGB <= hw.totalRAMGB

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">AI Models</span>
        <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={refresh}>Refresh</button>
      </div>
      <div className="content" style={{ maxWidth: 680 }}>

        {/* Hardware card */}
        <div style={{
          background: 'var(--surface)', borderRadius: 10, padding: '14px 18px',
          marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap',
        }}>
          <HwItem label="Platform" value={platformLabel} />
          <HwItem label="RAM" value={`${hw.totalRAMGB} GB`} />
          <HwItem label="CPU" value={hw.cpuModel.length > 40 ? hw.cpuModel.slice(0, 38) + '…' : hw.cpuModel} />
          <HwItem label="Arch" value={hw.arch} />
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        {/* Model list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {models.map(m => {
            const canRun = fits(m)
            const isDownloading = downloading === m.id
            const pct = isDownloading && progress ? progress.percent : 0

            return (
              <div key={m.id} style={{
                background: 'var(--surface)', border: `1px solid ${m.isActive ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10, padding: 18, opacity: canRun ? 1 : 0.55,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</span>
                      {m.isRecommended && (
                        <span style={{
                          fontSize: 10, background: 'var(--accent)', color: '#000',
                          padding: '1px 7px', borderRadius: 100, fontWeight: 700,
                        }}>Recommended</span>
                      )}
                      {m.isActive && m.downloaded && (
                        <span style={{
                          fontSize: 10, border: '1px solid var(--accent)', color: 'var(--accent)',
                          padding: '1px 7px', borderRadius: 100,
                        }}>Active</span>
                      )}
                      {m.chineseFocus && (
                        <span style={{
                          fontSize: 10, background: 'var(--surface2)', color: 'var(--muted)',
                          padding: '1px 7px', borderRadius: 100,
                        }}>Chinese+</span>
                      )}
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{m.description}</p>

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                      <span>💾 {m.sizeMB >= 1000 ? (m.sizeMB / 1000).toFixed(1) + ' GB' : m.sizeMB + ' MB'}</span>
                      <span>🧠 {m.ramRequiredGB} GB RAM min</span>
                      <span>{'★'.repeat(m.quality)}{'☆'.repeat(5 - m.quality)}</span>
                      {!canRun && <span style={{ color: '#f87171' }}>⚠ Not enough RAM</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', minWidth: 100 }}>
                    {m.downloaded ? (
                      <>
                        {!m.isActive && (
                          <button className="btn btn-primary" style={{ fontSize: 12, padding: '5px 14px' }}
                            onClick={() => setActive(m.id)}>
                            Use this
                          </button>
                        )}
                        {m.isActive && (
                          <span style={{ fontSize: 12, color: 'var(--accent)' }}>✓ In use</span>
                        )}
                      </>
                    ) : isDownloading ? null : (
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12, padding: '5px 14px' }}
                        disabled={!canRun}
                        onClick={() => startDownload(m.id)}
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>

                {/* Download progress */}
                {isDownloading && progress && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>
                      <span>Downloading from hf-mirror.com…</span>
                      <span>{progress.downloadedMB} / {progress.totalMB} MB · {pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%', background: 'var(--accent)', borderRadius: 2,
                        width: `${pct}%`, transition: 'width 0.4s',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 20 }}>
          Models are stored in your app data folder and run fully offline.
          Download uses hf-mirror.com (accessible in China).
        </p>
      </div>
    </>
  )
}

function HwItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  )
}
