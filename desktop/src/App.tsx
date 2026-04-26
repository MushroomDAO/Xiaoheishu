import { useState, createContext, useContext } from 'react'
import Library from './pages/Library'
import Editor from './pages/Editor'
import Publish from './pages/Publish'
import Models from './pages/Models'
import Settings from './pages/Settings'

type Page = 'library' | 'editor' | 'publish' | 'models' | 'settings'
export type Lang = 'en' | 'zh'

export type Post = {
  id?: number
  title: string
  title_en?: string
  content: string
  content_en?: string
  city?: string
  tags?: string
  cover_image?: string
  images?: string        // JSON array of file paths
  status?: string
  published_platforms?: string
  created_at?: string
}

export const LangContext = createContext<Lang>('en')
export function useLang() { return useContext(LangContext) }

export const t = (en: string, zh: string, lang: Lang) => lang === 'zh' ? zh : en

export default function App() {
  const [page, setPage] = useState<Page>('library')
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [lang, setLang] = useState<Lang>('en')

  function openEditor(post?: Post) {
    setEditingPost(post ?? { title: '', content: '' })
    setPage('editor')
  }

  function openPublish(post: Post) {
    setEditingPost(post)
    setPage('publish')
  }

  const nav = [
    ['library', '📚', 'Library', '内容库'],
    ['editor', '✍️', 'New Post', '新建'],
    ['publish', '🚀', 'Publish', '发布'],
    ['models', '🤖', 'AI Models', 'AI 模型'],
    ['settings', '⚙️', 'Settings', '设置'],
  ] as [Page, string, string, string][]

  return (
    <LangContext.Provider value={lang}>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">小黑书</div>
          <nav className="sidebar-nav">
            {nav.map(([id, icon, en, zh]) => {
              // Editing existing post → Library active only (not New Post)
              const editingExisting = page === 'editor' && !!editingPost?.id
              const isActive =
                (page === id && !editingExisting) ||
                (id === 'library' && editingExisting)
              return (
              <button
                key={id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => id === 'editor' ? openEditor() : setPage(id)}
              >
                <span>{icon}</span>
                <span>{lang === 'zh' ? zh : en}</span>
              </button>
              )
            })}
          </nav>
          <button
            className="lang-toggle"
            onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
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
          {page === 'models' && (
            <Models />
          )}
          {page === 'settings' && (
            <Settings />
          )}
        </main>
      </div>
    </LangContext.Provider>
  )
}
