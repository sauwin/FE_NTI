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
  status: 'draft' | 'open' | 'closed' | 'archived'
  deadline_at?: string | null
  opens_at?: string | null
  min_team_size?: number
  max_team_size?: number | null

  program?: {
    id: number
    code: string
    type: string
  }
}

export interface CallData {
  id: number
  name: string
  min_team_size: number
  max_team_size: number | null
  deadline_at: string | null
}
