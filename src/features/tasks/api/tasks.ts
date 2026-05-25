import api from '@/shared/api/axios'
import type { TaskDetails } from '@/features/tasks/types/tasks'
import type { TaskWithCall } from '@/features/company/types/company'

export function getTaskById(id: number | string) {
  return api.get<TaskDetails>(`/tasks/${id}`)
}

export function getProgramBTasks() {
  return api.get<TaskWithCall[]>('/programs/b/tasks')
}

export function createCallWithTask(formData: FormData) {
  return api.post('/calls-with-tasks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
