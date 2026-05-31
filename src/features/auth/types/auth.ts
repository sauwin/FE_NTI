export interface AuthUser {
  email: string
  first_name?: string
  last_name?: string
  role_slug?: string
  organization_id?: number
  status: string
  id: number
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  password_confirmation: string
  first_name: string
  last_name: string
  role: string
  company_type?: string
  [key: string]: unknown
}

export interface RoleStatus {
  approved: boolean
}

export interface ResetPasswordPayload {
  token: string
  email?: string
  password: string
  password_confirmation: string
}
