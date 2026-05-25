import api from '@/shared/api/axios'
import type { StudentProfile, StudentProfileCompletePayload } from '@/features/student/types/profile'

export function getStudentProfile() {
  return api.get<StudentProfile>('/profile/student')
}

export function getProfile() {
  return api.get('/profile')
}

export function updateProfile(payload: StudentProfile) {
  return api.put('/profile', payload)
}

export function completeStudentProfile(payload: StudentProfileCompletePayload) {
  return api.post('/profile/student', payload)
}
