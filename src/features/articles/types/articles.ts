export type ArticleLang = 'en' | 'sk'

export interface ArticleTranslation {
  id?: number
  article_id?: number
  language: string
  title: string
  excerpt: string
  content: string
  created_at?: string
  updated_at?: string
}

export interface ArticleImage {
  image_path: string
}

export interface Article {
  id: number
  slug: string
  author_id: number
  is_published: boolean
  published_at: string
  created_at: string
  updated_at: string
  translations: ArticleTranslation[]
  cover_image?: ArticleImage
}

export interface ArticleApi {
  id: number
  slug: string
  is_published: boolean
  translations: ArticleTranslation[]
}

export interface ArticleForm {
  slug: string
  is_published: boolean
  translations: Partial<ArticleTranslation>[]
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ArticlesResponse {
  data: Article[]
  meta: PaginationMeta
}

export interface ApiResponse<T> {
  data: T
}
