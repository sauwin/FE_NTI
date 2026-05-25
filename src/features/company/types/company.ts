export interface CompanyUser {
  id: number
  email: string
  first_name?: string
  last_name?: string
  status?: string
  roles?: unknown[]
  role_slug?: string
}

export interface CompanyProfile {
  name?: string
  registration_number?: string
  sector?: string
  description?: string
  website?: string
  industry?: string
  logo_path?: string
  [key: string]: unknown
}

export type TaskStatus =
  | 'draft'
  | 'open'
  | 'published'
  | 'in_matching'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'closed'
  | string

export interface CompanyTaskProgram {
  id: number
  code: string
}

export interface CompanyTaskCall {
  id: number
  program?: CompanyTaskProgram | null
}

export interface CompanyTask {
  id: number
  title: string
  brief?: string | null
  short_description?: string | null
  budget?: string | number | null
  status: TaskStatus
  created_at?: string
  call_id?: number
  program?: { name?: string }
  call?: CompanyTaskCall | { name?: string; deadline_at?: string } | null
}

export interface TaskOrganization {
  id: number
  name: string
  logo_path: string | null
}

export interface TaskCallData {
  id: number
  name: string
  status?: 'draft' | 'open' | 'closed' | 'archived'
  opens_at?: string | null
  deadline_at?: string | null
  min_team_size?: number
  max_team_size?: number | null
  required_documents?: unknown
}

export interface TaskWithCall {
  id: number
  call_id?: number
  organization_id?: number
  title: string
  short_description?: string | null
  brief?: string | null
  budget?: string | null
  status: string
  deadline?: string | null
  required_technologies?: string[]
  required_skills?: string[]
  call?: TaskCallData
  organization?: TaskOrganization
}
