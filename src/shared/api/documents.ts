import api from '@/shared/api/axios'

export function uploadDocument(formData: FormData) {
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function downloadDocument(id: number | string) {
  return api.get(`/documents/${id}/download`, { responseType: 'blob' })
}

export function downloadDocumentBlob(endpoint: string) {
  return api.get(endpoint, { responseType: 'blob' })
}
