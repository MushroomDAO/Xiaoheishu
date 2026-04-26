import { useEffect, useState } from 'react'
import type { Post } from '../App'

declare global {
  interface Window {
    xhs: {
      listPosts: () => Promise<Post[]>
      getPost: (id: number) => Promise<Post>
      savePost: (post: Post) => Promise<number>
      deletePost: (id: number) => Promise<void>
      publish: (postId: number, platforms: string[]) => Promise<Record<string, string>>
      publishStatus: (cb: (s: unknown) => void) => void
    }
  }
}

export default function Library({ onEdit, onPublish }: {
  onEdit: (post: Post) => void
  onPublish: (post: Post) => void
}) {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    window.xhs.listPosts().then(setPosts)
  }, [])

  return (
    <>
      <div className="topbar">
        <span className="topbar-title">Library</span>
        <button className="btn btn-primary" onClick={() => onEdit()}>+ New Post</button>
      </div>
      <div className="content">
        {posts.length === 0 ? (
          <p style={{ color: 'var(--muted)', paddingTop: 40, textAlign: 'center' }}>
            还没有内容，点击右上角新建
          </p>
        ) : (
          <div className="post-grid">
            {posts.map(post => {
              const platforms = JSON.parse(post.published_platforms || '{}')
              return (
                <div key={post.id} className="post-card" onClick={() => onEdit(post)}>
                  {post.cover_image && (
                    <img
                      src={`localfile://${post.cover_image}`}
                      style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 10, display: 'block' }}
                    />
                  )}
                  <div className="post-card-title">{post.title}</div>
                  <div className="post-card-meta">
                    {post.city && `📍 ${post.city} · `}
                    {post.created_at?.split('T')[0]}
                  </div>
                  <div className="post-card-platforms">
                    {['xiaoheishu', 'wechat', 'xiaohongshu'].map(p => (
                      <span key={p} className={`platform-badge ${platforms[p] ? 'done' : ''}`}>
                        {p === 'xiaoheishu' ? '小黑书' : p === 'wechat' ? '公众号' : '小红书'}
                      </span>
                    ))}
                    <button
                      className="btn btn-ghost"
                      style={{ marginLeft: 'auto', fontSize: 12, padding: '2px 10px' }}
                      onClick={e => { e.stopPropagation(); onPublish(post) }}
                    >
                      Publish
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
