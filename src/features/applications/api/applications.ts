import api from '@/shared/api/axios'
import type { ApplicationPayload } from '@/features/applications/types/applications'

export function getApplications() {
  return api.get('/applications')
}

export function getActiveCall(programType: 'a' | 'b') {
  return api.get(`/calls/active/${programType}`)
}

export function getApplicationById(id: number | string) {
  return api.get(`/applications/${id}`)
}

export function getApplicationDocuments(id: number | string) {
  return api.get(`/applications/${id}/documents`)
}

export function createApplication(payload: ApplicationPayload) {
  return api.post('/applications', payload)
}

export function updateApplication(id: number | string, payload: Partial<ApplicationPayload> & Record<string, unknown>) {
  return api.patch(`/applications/${id}`, payload)
}

export function updateApplicationStatus(id: number | string, status: string) {
  return api.patch(`/applications/${id}/status`, { status })
}

export function deleteApplication(id: number | string) {
  return api.delete(`/applications/${id}`)
}

export function submitApplication(id: number | string) {
  return api.post(`/applications/${id}/submit`)
}

export function applyApplicationChanges(id: number | string) {
  return api.post(`/applications/${id}/apply-changes`)
}

export function getApplicationLastRevision(id: number | string) {
  return api.post(`/applications/${id}/last_revision`)
}


