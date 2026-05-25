import api from '@/shared/api/axios'
import type { EvaluationPayload } from '@/features/evaluation/types/evaluations'

export function getEvaluations(params?: { application_id?: number; evaluator_id?: number }) {
  return api.get('/evaluations', { params })
}

export function getEvaluationById(id: number | string) {
  return api.get(`/evaluations/${id}`)
}

export function createEvaluation(payload: EvaluationPayload) {
  return api.post('/evaluations', payload)
}

export function updateEvaluation(id: number | string, payload: Partial<EvaluationPayload>) {
  return api.patch(`/evaluations/${id}`, payload)
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
