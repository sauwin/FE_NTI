import api from '@/shared/api/axios'
import type { ActiveCall, CallShortInfo } from '@/shared/types/calls'

export function getCallById(id: number | string) {
  return api.get<CallShortInfo>(`/calls/${id}`)
}

export function getActiveCallByProgram(program: 'a' | 'b') {
  return api.get<ActiveCall>(`/calls/active/${program}`)
}

export function getActiveCallQuery(program: 'a' | 'b') {
  return api.get<ActiveCall>(`/calls/active?program=${program}`)
}

export function getActiveCalls(program?: 'a' | 'b') {
  return api.get<ActiveCall[]>(
    program
      ? `/calls/active/${program}`
      : '/calls/active'
  )
}