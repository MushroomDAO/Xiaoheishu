import { useState, useEffect, useRef } from 'react'
import type { Post } from '../App'

type Mode = 'input' | 'processing' | 'review' | 'manual'

const AI_STEPS = [
  { label: 'Reading your content…',        icon: '📖' },
  { label: 'Extracting title & location…', icon: '📍' },
  { label: 'Generating tags…',             icon: '🏷️' },
  { label: 'Formatting in Markdown…',      icon: '✍️' },
  { label: 'Translating to English…',      icon: '🌐' },
  { label: 'Optimizing for GEO indexing…', icon: '🔍' },
]

declare global {
  interface Window {
    xhs: {
      listPosts: () => Promise<Post[]>
      getPost: (id: number) => Promise<Post>
      savePost: (post: Post) => Promise<number>
      deletePost: (id: number) => Promise<void>
      publish: (postId: number, platforms: string[], force?: string[]) => Promise<Record<string, string>>
      publishStatus: (cb: (s: unknown) => void) => void
      openPreview: (postId: number) => Promise<void>
      modelsStatus: () => Promise<{ active: string; models: { id: string; downloaded: boolean }[] }>
      modelsDownload: (id: string, cb: (p: unknown) => void) => Promise<void>
      modelsSetActive: (id: string) => Promise<void>
      aiExtract: (rawText: string) => Promise<{
        title: string; title_en: string; city: string
        tags: string; content: string; content_en: string
      }>
      saveImage: (bytes: number[], ext: string) => Promise<string>
    }
  }
}

async function readFileAsImage(file: File): Promise<string> {
  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
  const buf = await file.arrayBuffer()
  return window.xhs.saveImage(Array.from(new Uint8Array(buf)), ext)
}

export default function Editor({ post, onSaved }: {
  post: Post
  onSaved: (post: Post) => void
}) {
  const isNew = !post.id
  const [mode, setMode] = useState<Mode>(isNew ? 'input' : 'manual')
  const [rawText, setRawText] = useState('')
  const [images, setImages] = useState<string[]>(() => {
    if (post.images) {
      try {
        const arr = JSON.parse(post.images) as string[]
        if (arr.length > 0) return arr   // only use if non-empty
      } catch { /* */ }
    }
    return post.cover_image ? [post.cover_image] : []
  })
  const [dragOver, setDragOver] = useState(false)
  const [form, setForm] = useState<Post>(post)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modelReady, setModelReady] = useState(false)
  const [aiStep, setAiStep] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    window.xhs.modelsStatus().then(d => {
      setModelReady(d.models.some(m => m.downloaded))
    })
  }, [])

  function update(field: keyof Post, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function addImages(files: FileList | File[]) {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    const paths = await Promise.all(arr.map(readFileAsImage))
    setImages(prev => [...prev, ...paths])
    if (!form.cover_image && paths[0]) {
      setForm(f => ({ ...f, cover_image: paths[0] }))
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const imageFiles = Array.from(e.clipboardData.items)
      .filter(i => i.kind === 'file' && i.type.startsWith('image/'))
      .map(i => i.getAsFile())
      .filter(Boolean) as File[]
    if (imageFiles.length) {
      e.preventDefault()
      addImages(imageFiles)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    addImages(e.dataTransfer.files)
  }

  async function runAI() {
    if (!rawText.trim() && images.length === 0) return
    setError('')
    setAiStep(0)
    setMode('processing')

    // Animate through steps while waiting for AI
    const msPerStep = Math.floor(8000 / AI_STEPS.length)
    stepTimerRef.current = setInterval(() => {
      setAiStep(s => Math.min(s + 1, AI_STEPS.length - 1))
    }, msPerStep)

    try {
      const result = await window.xhs.aiExtract(rawText)
      clearInterval(stepTimerRef.current!)
      setAiStep(AI_STEPS.length)  // all done
      setForm(f => ({
        ...f,
        ...result,
        cover_image: f.cover_image || images[0] || '',
      }))
      setMode('review')
    } catch (e) {
      clearInterval(stepTimerRef.current!)
      setError(String(e))
      setMode('input')
    }
  }

  async function save() {
    setSaving(true)
    const saveForm = {
      ...form,
      images: JSON.stringify(images),
      cover_image: images[0] ?? form.cover_image ?? '',
    }
    const id = await window.xhs.savePost(saveForm)
    setSaving(false)
    onSaved({ ...saveForm, id })
  }

  // ── Input / Processing ──────────────────────────────────────────────────
  if (mode === 'input' || mode === 'processing') {
    return (
      <>
        <div className="topbar">
          <span className="topbar-title">New Post</span>
          <button className="btn btn-ghost" style={{ fontSize: 12 }}
            onClick={() => setMode('manual')}>Manual</button>
        </div>
        <div className="content" style={{ maxWidth: 680 }}>

          {/* Model status */}
          {!modelReady ? (
            <div style={{
              marginBottom: 16, padding: '10px 14px',
              background: 'var(--surface)', borderRadius: 8,
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
            }}>
              <span style={{ color: '#f87171' }}>⚠</span>
              <span style={{ color: 'var(--muted)', flex: 1 }}>No AI model downloaded yet.</span>
              <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 14px' }}
                onClick={() => (window as any).__xhsSetPage?.('models')}>
                Go to AI Models →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12, color: 'var(--muted)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
              Local AI ready · fully offline
            </div>
          )}

          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
            Paste text, images, or drop files — AI extracts title, tags, city, translates
          </p>

          {/* Drop zone wrapping textarea */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              position: 'relative',
              borderRadius: 8,
              outline: dragOver ? '2px dashed var(--accent)' : '2px dashed transparent',
              transition: 'outline 0.15s',
            }}
          >
            <textarea
              className="editor-input editor-textarea"
              style={{ minHeight: 280, fontSize: 15, lineHeight: 1.9 }}
              placeholder={'Paste text or images here (⌘V), or drag & drop files…\n\nExample: Today I went to Tianjin Italian Quarter, the lights were stunning at night, had seafood with friends, ~200 RMB, highly recommend for night photography.'}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              onPaste={handlePaste}
              disabled={mode === 'processing'}
              autoFocus
            />
            {dragOver && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 8,
                background: 'rgba(200,153,58,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: 'var(--accent)', pointerEvents: 'none',
              }}>
                Drop images here
              </div>
            )}
          </div>

          {/* Image thumbnails */}
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {images.map((src, i) => (
                <div key={src} style={{ position: 'relative' }}>
                  <img
                    src={`localfile://${src}`}
                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                  />
                  {i === 0 && (
                    <span style={{
                      position: 'absolute', bottom: 2, left: 2,
                      fontSize: 9, background: 'var(--accent)', color: '#000',
                      padding: '1px 4px', borderRadius: 3, fontWeight: 700,
                    }}>cover</span>
                  )}
                  <button
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#f87171', border: 'none', color: '#fff',
                      fontSize: 11, lineHeight: 1, cursor: 'pointer', padding: 0,
                    }}
                  >×</button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 72, height: 72, borderRadius: 6,
                  border: '1px dashed var(--border)', background: 'none',
                  color: 'var(--muted)', fontSize: 22, cursor: 'pointer',
                }}
              >+</button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => e.target.files && addImages(e.target.files)}
          />

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{error}</p>
          )}

          {/* AI steps — shown while processing */}
          {mode === 'processing' && (
            <div style={{
              marginTop: 16, background: 'var(--surface)', borderRadius: 10, padding: '14px 18px',
            }}>
              {AI_STEPS.map((step, i) => {
                const done = i < aiStep
                const active = i === aiStep
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '5px 0', fontSize: 13,
                    color: done ? 'var(--text)' : active ? 'var(--accent)' : 'var(--muted)',
                    transition: 'color 0.3s',
                  }}>
                    <span style={{ fontSize: 15, minWidth: 20 }}>
                      {done ? '✅' : active ? step.icon : '○'}
                    </span>
                    <span style={{ fontWeight: active ? 500 : 400 }}>{step.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: 15, padding: '10px 28px' }}
              onClick={runAI}
              disabled={mode === 'processing' || (!rawText.trim() && images.length === 0) || !modelReady}
            >
              {mode === 'processing' ? '✨ AI processing…' : '✨ Smart Fill'}
            </button>
            {images.length === 0 && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13 }}
                onClick={() => fileInputRef.current?.click()}
              >
                + Add images
              </button>
            )}
            {mode === 'processing' && (
              <span style={{ fontSize: 13, color: 'var(--muted)', animation: 'pulse 1.5s infinite' }}>
                Extracting structure, translating…
              </span>
            )}
          </div>
        </div>
      </>
    )
  }

  // ── Review ──────────────────────────────────────────────────────────────
  if (mode === 'review') {
    const tags = form.tags
      ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
      : []

    return (
      <>
        <div className="topbar">
          <span className="topbar-title">Review</span>
          <button className="btn btn-ghost" style={{ fontSize: 12 }}
            onClick={() => setMode('input')}>Retry</button>
          <button className="btn btn-ghost" style={{ fontSize: 12 }}
            onClick={() => setMode('manual')}>Edit manually</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="content" style={{ maxWidth: 680 }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 12, padding: 24,
            display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            <Field label="Title">
              <input className="editor-input" value={form.title}
                onChange={e => update('title', e.target.value)} />
            </Field>

            <Field label="English Title">
              <input className="editor-input" value={form.title_en || ''}
                onChange={e => update('title_en', e.target.value)} />
            </Field>

            <div style={{ display: 'flex', gap: 16 }}>
              <Field label="City" style={{ flex: 1 }}>
                <input className="editor-input" value={form.city || ''}
                  onChange={e => update('city', e.target.value)} />
              </Field>
              <Field label="Tags" style={{ flex: 2 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {tags.map(t => (
                    <span key={t} style={{
                      background: 'var(--surface2)', border: '1px solid var(--accent)',
                      borderRadius: 100, padding: '2px 12px', fontSize: 12, color: 'var(--accent)',
                    }}>{t}</span>
                  ))}
                </div>
                <input className="editor-input" value={form.tags || ''}
                  onChange={e => update('tags', e.target.value)}
                  style={{ fontSize: 12 }} placeholder="comma separated" />
              </Field>
            </div>

            <Field label="Content">
              <div style={{
                background: 'var(--surface2)', borderRadius: 8, padding: '12px 16px',
                fontSize: 14, lineHeight: 1.9, maxHeight: 220, overflowY: 'auto',
                whiteSpace: 'pre-wrap', color: 'var(--text)',
              }}>
                {form.content}
              </div>
            </Field>

            {form.content_en && (
              <Field label="English (GEO)">
                <div style={{
                  background: 'var(--surface2)', borderRadius: 8, padding: '12px 16px',
                  fontSize: 13, lineHeight: 1.9, maxHeight: 160, overflowY: 'auto',
                  whiteSpace: 'pre-wrap', color: 'var(--muted)',
                }}>
                  {form.content_en}
                </div>
              </Field>
            )}
          </div>
        </div>
      </>
    )
  }

  // ── Manual edit ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="topbar">
        <span className="topbar-title">{form.id ? 'Edit Post' : 'New Post'}</span>
        {!form.id && (
          <button className="btn btn-ghost" style={{ fontSize: 12 }}
            onClick={() => setMode('input')}>← Smart Fill</button>
        )}
        {form.id && (
          <button className="btn btn-ghost" style={{ fontSize: 12 }}
            onClick={() => window.xhs.openPreview(form.id!)}>Preview</button>
        )}
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <div className="content" style={{ padding: 0 }}>
        <div className="editor-layout" style={{ padding: 24 }}>
          <div className="editor-pane">
            <div className="editor-field">
              <label className="editor-label">Title (Chinese)</label>
              <input className="editor-input" value={form.title}
                onChange={e => update('title', e.target.value)} placeholder="标题" />
            </div>
            <div className="editor-field">
              <label className="editor-label">Title (English)</label>
              <input className="editor-input" value={form.title_en || ''}
                onChange={e => update('title_en', e.target.value)} placeholder="English title" />
            </div>
            <div className="editor-field" style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="editor-label">City</label>
                <input className="editor-input" value={form.city || ''}
                  onChange={e => update('city', e.target.value)} placeholder="Tianjin" />
              </div>
              <div style={{ flex: 2 }}>
                <label className="editor-label">Tags (comma separated)</label>
                <input className="editor-input" value={form.tags || ''}
                  onChange={e => update('tags', e.target.value)} placeholder="food, travel" />
              </div>
            </div>

            {/* Images */}
            <div className="editor-field">
              <label className="editor-label">Images</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  display: 'flex', gap: 8, flexWrap: 'wrap', padding: 8,
                  borderRadius: 8, border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--border)',
                  minHeight: 56, alignItems: 'center',
                }}
                onPaste={handlePaste}
                tabIndex={0}
              >
                {images.map((src, i) => (
                  <div key={src} style={{ position: 'relative' }}>
                    <img
                      src={`localfile://${src}`}
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                    />
                    {i === 0 && (
                      <span style={{
                        position: 'absolute', bottom: 2, left: 2,
                        fontSize: 9, background: 'var(--accent)', color: '#000',
                        padding: '1px 4px', borderRadius: 3, fontWeight: 700,
                      }}>cover</span>
                    )}
                    <button
                      onClick={() => {
                        const next = images.filter((_, idx) => idx !== i)
                        setImages(next)
                        setForm(f => ({ ...f, cover_image: next[0] ?? '' }))
                      }}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#f87171', border: 'none', color: '#fff',
                        fontSize: 11, lineHeight: 1, cursor: 'pointer', padding: 0,
                      }}
                    >×</button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 64, height: 64, borderRadius: 6,
                    border: '1px dashed var(--border)', background: 'none',
                    color: 'var(--muted)', fontSize: 22, cursor: 'pointer',
                  }}
                >+</button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Drag & drop, paste (⌘V), or click + to add images. First image = cover.
              </p>
            </div>
            <div className="editor-field" style={{ flex: 1 }}>
              <label className="editor-label">Content (Chinese, Markdown)</label>
              <textarea className="editor-input editor-textarea"
                value={form.content}
                onChange={e => update('content', e.target.value)}
                placeholder="Markdown supported…" />
            </div>
          </div>
          <div className="editor-pane">
            <div className="editor-field" style={{ flex: 1 }}>
              <label className="editor-label">Content (English, for GEO)</label>
              <textarea className="editor-input editor-textarea"
                value={form.content_en || ''}
                onChange={e => update('content_en', e.target.value)}
                placeholder="English version for AI engine indexing…" />
            </div>
          </div>
        </div>
      </div>
      {/* Hidden file input — shared by both image drop zones in manual mode */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && addImages(e.target.files)}
      />
    </>
  )
}

function Field({ label, children, style }: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <div style={{
        fontSize: 11, color: 'var(--muted)', marginBottom: 6,
        fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}
