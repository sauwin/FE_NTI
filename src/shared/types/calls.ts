import type { Program } from '@/shared/types/programs'

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

  created_at: string
  updated_at: string

  opens_at: string | null
  deadline_at: string | null
  evaluation_scheduled_at: string | null

  created_by: number
  program_id: number

  min_team_size: number
  max_team_size: number

  required_documents: string[]
  evaluation_criteria: Record<string, number>
  program: Program
}

export interface CallData {
  id: number
  name: string
  min_team_size: number
  max_team_size: number | null
  deadline_at: string | null
}
