import api from '@/shared/api/axios'

export interface Mentorship {
  id: number
  assigned_at: string
  application: {
    id: number
    status: string
    team?: { name: string }
    program?: { name: string; focus?: string }
  }
}

export interface Consultation {
  id: number
  date: string
  summary: string
  duration_minutes: number
}

export interface MentorshipDetailsResponse {
  id: number
  consultations: Consultation[]
}

export interface CreateConsultationDTO {
  date: string
  duration_minutes: number
  summary: string
}

export const mentorshipsApi = {
  async getMentorships(): Promise<Mentorship[]> {
    const response = await api.get<Mentorship[]>('/mentorships')
    return response.data
  },

  async getMentorshipDetails(id: number): Promise<MentorshipDetailsResponse> {
    const response = await api.get<MentorshipDetailsResponse>(`/mentorships/${id}`)
    return response.data
  },

  async createConsultation(mentorshipId: number, data: CreateConsultationDTO): Promise<{ data: Consultation }> {
    const response = await api.post<{ data: Consultation }>(`/mentorships/${mentorshipId}/consultations`, data)
    return response.data
  }
}