export interface AdminProgram {
  id: number
  title?: string
  name?: string
  code: 'program_a' | 'program_b'
  description: string
}

export interface AdminCall {
  id: number
  program_id: number
  name: string
  status: 'draft' | 'open' | 'closed' | 'archived'
  opens_at: string | null
  deadline_at: string | null
  min_team_size: number
  max_team_size: number | null
  form_config?: string
}

export interface RequiredDocument {
  document_name: string
  is_mandatory: boolean
  max_size_mb: number
}

export interface DashboardStats {
  total_users: number
  active_projects: number
  pending_approvals: number
  open_calls: number
  blocked_users?: number
  evaluators?: number
  mentors?: number
  admins?: number
  draft_calls?: number
  closed_calls?: number
  archived_calls?: number
  applications_total?: number
}

export interface AdminApplication {
  id: number
  status: string
  program_type: string
  applicant_name?: string
  team_name?: string
  call_id?: number
  created_at?: string
}

export interface AdminApplicationListItem {
  id: number
  applicant_name: string
  applicant_email: string
  program: string
  program_type: string
  call_name: string
  datum: string
  status: string
}

export interface AdminUser {
  id: number
  email: string
  first_name?: string
  last_name?: string
  status?: string
  roles?: { slug: string; name?: string }[]
}

export interface AdminRole {
  slug: string
  name?: string
}

export interface DocumentItem {
  id: number
  file_name: string
  mime_type?: string
  file_size_bytes?: number
  type?: string
  classification?: string
  application_id?: number
  uploaded_by?: number
  created_at?: string
}

export interface CallPayload {
  program_type: string
  title: string
  status: string
  opens_at: string
  deadline_at: string
  min_team_size: number
  max_team_size: number
  evaluation_criteria: unknown[]
  required_documents: RequiredDocument[]
  form_config?: string
}

export interface CreateAdminPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: string
}

export interface BulkNotificationPayload {
  recipient_group: string
  subject: string
  message: string
}
