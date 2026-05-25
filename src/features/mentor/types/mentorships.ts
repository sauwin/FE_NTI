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

export interface CreateConsultationPayload {
  date: string
  duration_minutes: number
  summary: string
}
