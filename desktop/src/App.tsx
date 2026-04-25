import { useState } from 'react'
import Library from './pages/Library'
import Editor from './pages/Editor'
import Publish from './pages/Publish'

type Page = 'library' | 'editor' | 'publish'

export type Post = {
  id?: number
  title: string
  title_en?: string
  content: string
  content_en?: string
  city?: string
  tags?: string
  cover_image?: string
  status?: string
  published_platforms?: string
  created_at?: string
}

export default function App() {
  const [page, setPage] = useState<Page>('library')
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  function openEditor(post?: Post) {
    setEditingPost(post ?? { title: '', content: '' })
    setPage('editor')
  }

  function openPublish(post: Post) {
    setEditingPost(post)
    setPage('publish')
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">小黑书</div>
        <nav className="sidebar-nav">
          {([
            ['library', '📚', '内容库'],
            ['editor', '✍️', '新建内容'],
            ['publish', '🚀', '发布'],
          ] as [Page, string, string][]).map(([id, icon, label]) => (
            <button
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => id === 'editor' ? openEditor() : setPage(id)}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        {page === 'library' && (
          <Library onEdit={openEditor} onPublish={openPublish} />
        )}
        {page === 'editor' && (
          <Editor
            post={editingPost!}
            onSaved={(post) => { setEditingPost(post); setPage('library') }}
          />
        )}
        {page === 'publish' && editingPost && (
          <Publish post={editingPost} />
        )}
      </main>
    </div>
  )
}
