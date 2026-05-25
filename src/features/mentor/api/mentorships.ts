import api from '@/shared/api/axios'
import type {
  Consultation,
  CreateConsultationPayload,
  Mentorship,
  MentorshipDetailsResponse,
} from '@/features/mentor/types/mentorships'

export function getMentorships() {
  return api.get<Mentorship[]>('/mentorships')
}

export function getMentorshipById(id: number | string) {
  return api.get<MentorshipDetailsResponse>(`/mentorships/${id}`)
}

export function createConsultation(mentorshipId: number | string, payload: CreateConsultationPayload) {
  return api.post<{ data: Consultation }>(`/mentorships/${mentorshipId}/consultations`, payload)
}
