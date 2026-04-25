export interface Env {
  DB: D1Database
  BASE_DOMAIN: string
  GITHUB_IMAGES_BASE: string
  SESSION_SECRET?: string
  // IMAGES: R2Bucket  // uncomment after enabling R2
}

export interface User {
  id: number
  username: string
  display_name: string
  display_name_en: string | null
  bio: string | null
  bio_en: string | null
  avatar_url: string | null
  city: string | null
}

export interface Post {
  id: number
  user_id: number
  slug: string
  title: string
  title_en: string | null
  content: string
  content_en: string | null
  cover_image: string | null
  images: string   // JSON string
  tags: string     // JSON string
  city: string | null
  geo_quotes: string // JSON string
  created_at: string
  updated_at: string
}

export type Lang = 'zh' | 'en'
