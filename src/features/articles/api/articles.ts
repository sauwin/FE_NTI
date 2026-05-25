import api from '@/shared/api/axios'
import type { ApiResponse, Article, ArticleApi } from '@/features/articles/types/articles'

export function getArticles() {
  return api.get('/articles')
}

export function getArticleById(id: number | string) {
  return api.get<ApiResponse<Article>>(`/articles/${id}`)
}

export function getArticleForEdit(id: number | string) {
  return api.get<ApiResponse<ArticleApi>>(`/articles/${id}`)
}

export function createArticle(formData: FormData) {
  return api.post('/articles', formData)
}

export function updateArticle(id: number | string, formData: FormData) {
  return api.put(`/articles/${id}`, formData)
}

export function deleteArticle(id: number | string) {
  return api.delete(`/articles/${id}`)
}
