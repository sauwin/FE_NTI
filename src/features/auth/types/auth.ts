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
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  role: string
  agreed_terms: boolean,
  gdpr_consent: boolean,
  role_in_org?: string
  registration_number?: number,
}

//Todo: update this with dashboard
export interface RoleStatus {
  approved: boolean
}

export interface ResetPasswordPayload {
  token: string
  password: string
  password_confirmation: string
}
