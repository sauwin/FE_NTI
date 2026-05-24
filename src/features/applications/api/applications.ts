import api from '@/shared/api/axios'

export interface ApplicationPayload {
  applicant_type: 'student' | 'team'
  program_type: 'a' | 'b'
  team_id?: number | null
  category?: string
  submit_type?: 'draft' | 'final'
  project_title?: string
  proposed_solution?: string
}

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

export function updateApplication(id: number | string, payload: Partial<ApplicationPayload>) {
  return api.patch(`/applications/${id}`, payload)
}

export function updateApplicationStatus(id: number | string, status: string) {
  return api.patch(`/applications/${id}/status`, { status })
}

export function deleteApplication(id: number | string) {
  return api.delete(`/applications/${id}`)
}

export function uploadApplicationDocument(formData: FormData) {
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}