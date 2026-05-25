export interface EvaluationScorePayload {
  criterion_key: string
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
