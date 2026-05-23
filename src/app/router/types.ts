export type Role = 'student' | 'mentor' | 'company'

export interface AppRouteMeta {
  requiresAuth?: boolean
  requiresProfile?: boolean
  role?: Role
}