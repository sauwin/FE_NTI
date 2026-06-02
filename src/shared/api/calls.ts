import api from '@/shared/api/axios'
import type { ActiveCall, CallShortInfo } from '@/shared/types/calls'

export function getCallById(id: number | string) {
  return api.get<CallShortInfo>(`/calls/${id}`)
}

export function getActiveCalls(program?: 'a' | 'b') {
  return api.get<ActiveCall[]>(
    program
      ? `/calls/active/${program}`
      : '/calls/active'
  )
}

export function getCallEvaluationCriteria(callId: number) {
  return api.get(`calls/${callId}/criteria`)
}