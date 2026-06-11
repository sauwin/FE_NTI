export interface ApplicationPayload {
  applicant_type: 'student' | 'team'
  program_type: 'a' | 'b'
  call_id?: number
  team_id?: number | null
  category?: string
  submit_type?: 'draft' | 'final'
  project_title?: string
  proposed_solution?: string
  academic_declaration?: boolean | number
}

export interface ApplicationData {
  id: number
  call_id: number
  team_id: number | null
  program_type: string
  category: string | null
  academic_declaration: boolean | number
  project_title: string | null
  proposed_solution: string | null
  applicant_type: 'student' | 'team'
}

export interface ExistingDocument {
  id: number
  file_name: string
  type: string
}

export interface StudentApplication {
  id: number
  call_id?: number
  team_id?: number | null
  status: string
  category: string | null
  program_type: string
  applicant_type: string
  project_title?: string
  created_at?: string
  call?: { name?: string; deadline_at?: string }
  team?: { name: string }
  total_evaluators_count?: number
}

export interface ApplicationRevisionRequest {
  application_id: number
  created_at: string | null
  deadline: string | null
  id: number
  message: string
  requested_by: number
  resolved_at: string | null
}

export interface ApplicationDocument {
  id: number
  uploaded_by: number
  type: string
  classification: string
  version: number

  file_path: string
  file_name: string
  mime_type: string

  file_size_bytes: number
  created_at: string
  pivot?: {
    application_id: number
    document_id: number
  }
}