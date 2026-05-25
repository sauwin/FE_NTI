import api from '@/shared/api/axios'
import type { FaqItemPayload } from '@/features/faq/types/faq'

export function getFaqItems(params?: Record<string, unknown>) {
  return api.get('/faq-items', { params })
}

export function createFaqItem(payload: FaqItemPayload) {
  return api.post('/faq-items', payload)
}

export function updateFaqItem(id: number | string, payload: FaqItemPayload) {
  return api.put(`/faq-items/${id}`, payload)
}

export function deleteFaqItem(id: number | string) {
  return api.delete(`/faq-items/${id}`)
}
