export interface Mentorship {
  id: number
  assigned_at: string
  application: {
    id: number
    status: string
    team?: { name: string }
    program_type?: string
    program?: { name: string }
    category?: string
  }
}

export interface Consultation {
  id: number
  date: string
  summary: string | null
  duration_minutes: number
  created_at?: string
  updated_at?: string
}

export interface MentorshipDetailsResponse {
  id: number
  consultations: Consultation[]
}

export interface CreateConsultationPayload {
  date: string
  duration_minutes: number
  summary: string | null
}

export interface UpdateConsultationPayload {
  date?: string
  duration_minutes?: number
  summary: string | null
}