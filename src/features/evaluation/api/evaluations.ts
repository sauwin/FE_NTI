import api from '@/shared/api/axios'
import type { EvaluationPayload } from '@/features/evaluation/types/evaluations'

// CLIENT / EVALUATOR PORTAL ENPOINTS
export function getEvaluatorApplications(params?: { program_type?: 'a' | 'b'; status?: 'pending' | 'completed' }) {
  return api.get('/evaluator/applications', { params })
}

export function getMyEvaluations() {
  return api.get('/evaluator/my-evaluations')
}

export function getEvaluatorApplicationById(id: number) {
  return api.get(`/evaluator/applications/${id}`)
}

export function createEvaluation(payload: EvaluationPayload) {
  return api.post('/evaluations', payload)
}

export function updateEvaluation(id: number | string, payload: Partial<EvaluationPayload>) {
  return api.patch(`/evaluations/${id}`, payload)
}

export function getApplicationDocumentStream(applicationId: number, fileId: number) {
  return api.get(`/evaluator/applications/${applicationId}/files/${fileId}`, { responseType: 'blob' })
}

// ADMIN ENDPOINTS
export function getAllEvaluations(params?: { application_id?: number; evaluator_id?: number }) {
  return api.get('/admin/evaluations', { params })
}

export function getCallEvaluators(callId: number | string) {
  return api.get(`/admin/calls/${callId}/evaluators`)
}

export function assignEvaluator(callId: number | string, userId: number) {
  return api.post(`/admin/calls/${callId}/evaluators`, { user_id: userId })
}

export function removeEvaluator(callId: number | string, userId: number) {
  return api.delete(`/admin/calls/${callId}/evaluators/${userId}`)
}