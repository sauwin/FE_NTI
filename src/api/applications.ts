import api from './axios'

export function getApplications(params: any = {}) {
  return api.get('/applications', { params })
}

export function getApplicationById(id: string) {
  return api.get(`/applications/${id}`)
}

export function createApplication(payload: any) {
  return api.post('/applications', payload)
}

export function updateApplication(id: string, payload: any) {
  return api.patch(`/applications/${id}`, payload)
}

export function updateApplicationStatus(id: string, status: string) {
  return api.patch(`/applications/${id}/status`, { status })
}

export function deleteApplication(id: string) {
  return api.delete(`/applications/${id}`)
}

export function getApplicationDocuments(id: string) {
  return api.get(`/applications/${id}/documents`)
}

export default {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationDocuments,
}
