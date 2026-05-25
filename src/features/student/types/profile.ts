export interface Skill {
  skill: string
  level: 'beginner' | 'intermediate' | 'advanced'
}

export interface StudentProfile {
  first_name?: string
  last_name?: string
  university?: string
  study_program?: string
  faculty?: string
  year_of_study?: number | null
  bio?: string
  skills?: Skill[]
  linkedin_url?: string
  github_url?: string
  academic_declaration_confirmed?: boolean
}

export interface StudentProfileCompletePayload {
  study_program: string
  year_of_study: number
  university: string
  bio: string
  github_url: string
  academic_declaration_confirmed: boolean
}
