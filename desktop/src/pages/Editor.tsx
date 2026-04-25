import { useState } from 'react'
import type { Post } from '../App'

export default function Editor({ post, onSaved }: {
  post: Post
  onSaved: (post: Post) => void
}) {
  const [form, setForm] = useState<Post>(post)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  function update(field: keyof Post, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function save() {
    setSaving(true)
    const id = await window.xhs.savePost(form)
    setSaving(false)
    onSaved({ ...form, id })
  }

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">{form.id ? '编辑内容' : '新建内容'}</span>
        <button className="btn btn-ghost" onClick={() => setPreviewOpen(!previewOpen)}>
          {previewOpen ? '关闭预览' : '预览'}
        </button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
      <div className="content" style={{ padding: 0 }}>
        <div className="editor-layout" style={{ padding: 24 }}>
          <div className="editor-pane">
            <div className="editor-field">
              <label className="editor-label">标题（中文）</label>
              <input className="editor-input" value={form.title}
                onChange={e => update('title', e.target.value)} placeholder="标题" />
            </div>
            <div className="editor-field">
              <label className="editor-label">Title (English, optional)</label>
              <input className="editor-input" value={form.title_en || ''}
                onChange={e => update('title_en', e.target.value)} placeholder="English title" />
            </div>
            <div className="editor-field" style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="editor-label">城市</label>
                <input className="editor-input" value={form.city || ''}
                  onChange={e => update('city', e.target.value)} placeholder="天津" />
              </div>
              <div style={{ flex: 2 }}>
                <label className="editor-label">标签（逗号分隔）</label>
                <input className="editor-input" value={form.tags || ''}
                  onChange={e => update('tags', e.target.value)} placeholder="美食, 旅行" />
              </div>
            </div>
            <div className="editor-field" style={{ flex: 1 }}>
              <label className="editor-label">正文（Markdown）</label>
              <textarea className="editor-input editor-textarea"
                value={form.content}
                onChange={e => update('content', e.target.value)}
                placeholder="支持 Markdown..." />
            </div>
          </div>

          {previewOpen && form.id ? (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <iframe
                src={`http://localhost:3456/preview/${form.id}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Preview"
              />
            </div>
          ) : (
            <div className="editor-pane">
              <div className="editor-field" style={{ flex: 1 }}>
                <label className="editor-label">英文正文（可选，用于 GEO）</label>
                <textarea className="editor-input editor-textarea"
                  value={form.content_en || ''}
                  onChange={e => update('content_en', e.target.value)}
                  placeholder="English version for AI engine indexing..." />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
