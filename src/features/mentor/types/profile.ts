export interface MentorProfile {
  first_name?: string
  last_name?: string
  expertise?: string
  bio?: string
  expertise_areas: string[]
  available: boolean
  linkedin_url?: string
  availability?: string
  [key: string]: unknown
}
