import api from '@/shared/api/axios'
import type { Program } from '@/shared/types/programs'

export function getPrograms() {
  return api.get<Program[]>('/programs')
}
