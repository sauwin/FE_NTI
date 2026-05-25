export interface CallShortInfo {
  id: number
  name: string
  required_documents?: string[] | Record<string, string> | null
  task?: {
    id: number
    title: string
    organization?: { name: string }
  } | null
}

export interface DocumentRequirement {
  document_name: string
  is_mandatory: boolean
  max_size_mb: number
}

export interface ActiveCall {
  id: number
  name: string
  label?: string
  status?: 'draft' | 'open' | 'closed'
  deadline_at?: string | null
  min_team_size?: number
  max_team_size?: number | null
  required_documents?: DocumentRequirement[] | string[] | Record<string, string> | null
  evaluation_criteria?: unknown[]
}

export interface CallData {
  id: number
  name: string
  min_team_size: number
  max_team_size: number | null
  deadline_at: string | null
}
