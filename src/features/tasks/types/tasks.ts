import type { CallData } from '@/shared/types/calls'

export interface Organization {
  id: number
  name: string
  logo_path: string | null
}

export interface AttachedDocument {
  id: number
  file_name: string
  file_path: string
  type?: string
}

export interface TaskDetails {
  id: number
  call_id: number
  organization_id: number
  title: string
  brief: string | null
  short_description: string | null
  budget: string | null
  status: string
  project_goal: string | null
  expected_outcome: string | null
  detailed_technical_description: string | null
  required_technologies: string[] | null
  architecture_requirements: string | null
  integrations_apis: string | null
  platforms: string | null
  required_skills: string[] | null
  preferred_team_size: number | null
  required_experience: string | null
  expected_duration: string | null
  milestones: string | null
  deadline: string | null
  call?: CallData
  organization?: Organization
  documents?: AttachedDocument[]
}

export interface DocumentRequirement {
  document_name: string
  is_mandatory: boolean
  max_size_mb: number
  type?: string
}
