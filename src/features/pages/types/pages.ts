export type PageLang = 'sk' | 'en'

export interface PageTranslation {
    id?: number
    page_id?: number
    language: string
    title: string
    content: string
    meta_title: string
    meta_description: string
}

export interface Page {
    id: number
    slug: string
    is_published: boolean
    created_at: string
    updated_at: string
    translations: PageTranslation[]
}

export interface PageForm {
    slug: string
    is_published: boolean
    translations: Record<PageLang, PageTranslation & { id?: number }>
}