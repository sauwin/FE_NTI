import api from '@/shared/api/axios'
import type { AxiosResponse } from 'axios'
import type { 
  Mentorship, 
  CreateConsultationPayload, 
  UpdateConsultationPayload,
  Consultation 
} from '../types/mentorships'

export function getMentorships(): Promise<AxiosResponse<Mentorship[]>> {
  return api.get('/mentorships')
}

export function getMentorshipById(id: number | string): Promise<AxiosResponse<Mentorship & { consultations: Consultation[] }>> {
  return api.get(`/mentorships/${id}`)
}

export function createConsultation(
  mentorshipId: number | string, 
  payload: CreateConsultationPayload
): Promise<AxiosResponse<{ message: string; data: Consultation }>> {
  return api.post(`/mentorships/${mentorshipId}/consultations`, payload)
}

export function updateConsultation(
  mentorshipId: number | string, 
  consultationId: number | string, 
  payload: UpdateConsultationPayload
): Promise<AxiosResponse<{ message: string; data: Consultation }>> {
  return api.patch(`/mentorships/${mentorshipId}/consultations/${consultationId}`, payload)
}

export function deleteConsultation(
  mentorshipId: number | string, 
  consultationId: number | string
): Promise<AxiosResponse<{ message: string }>> {
  return api.delete(`/mentorships/${mentorshipId}/consultations/${consultationId}`)
}

export function updateApplicationStatusByMentor(applicationId: number | string, status: string) {
  return api.patch(`/applications/${applicationId}/status`, { status })
}

export function deleteMentorshipByMentor(mentorshipId: number | string) {
  return api.delete(`/mentorships/${mentorshipId}`)
}