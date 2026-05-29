import api from '@/shared/api/axios'
import type { Page } from '@/features/pages/types/pages'

export function getPageBySlug(slug: string) {
    return api.get<{ data: Page }>(`/pages/${slug}`)
}

export function getAdminPages() {
    return api.get<{ data: Page[] }>('/admin/pages')
}

export function createAdminPage(payload: Record<string, unknown>) {
    return api.post('/admin/pages', payload)
}

export function updateAdminPage(id: number | string, payload: Record<string, unknown>) {
    return api.put(`/admin/pages/${id}`, payload)
}

export function deleteAdminPage(id: number | string) {
    return api.delete(`/admin/pages/${id}`)
}

export function toggleAdminPagePublish(id: number | string, is_published: boolean) {
    return api.patch(`/admin/pages/${id}/publish`, { is_published })
}