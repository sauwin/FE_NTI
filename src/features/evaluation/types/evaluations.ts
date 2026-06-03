import type { AuthUser } from "@/features/auth/types/auth"

export interface EvaluationScorePayload {
  criterion_id: number
  score: number
  weight_at_moment: number
  comment?: string
}

export interface EvaluationPayload {
  application_id: number
  scores: EvaluationScorePayload[]
  recommendation: 'approve' | 'reject' | 'request_revision'
  comment?: string
}

export interface EvaluationCriterion {
  id: number
  call_id: number
  slug: string
  title: string
  comment: string | null
  weight: number
  created_at: string
  updated_at: string
}

export interface EvaluationScore {
  id: number
  evaluation_id: number
  criterion_id: number
  score: string
  weight_at_moment: string
  comment: string | null
  created_at: string
  updated_at: string
  criterion: EvaluationCriterion
}

export interface Evaluation {
  id: number
  application_id: number
  evaluator_id: number

  overall_score: string

  recommendation: 'approve' | 'reject' | 'request_revision'
  status: 'in_progress' | 'completed'

  comment: string | null

  evaluated_at: string

  created_at: string
  updated_at: string

  evaluator: AuthUser
  scores: EvaluationScore[]
}

