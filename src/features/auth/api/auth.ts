import api from '@/shared/api/axios'
import type { LoginPayload, RegisterPayload, ResetPasswordPayload } from '@/features/auth/types/auth'

export function login(payload: LoginPayload) {
  return api.post('/auth/login', payload)
}

export function register(payload: RegisterPayload) {
  return api.post('/auth/register', payload)
}

export function logout() {
  return api.post('/auth/logout')
}

export function getMe() {
  return api.get('/auth/me')
}

//Todo: update this with dashboard
export function getRoleStatus() {
  return api.get('/auth/role-status')
}

export function forgotPassword(email: string) {
  return api.post('/auth/forgot-password', { email })
}

//Frontend token verification
export function verifyResetToken(token: string) {
  return api.post('/auth/verify-reset-token', { token })
}

export function resetPassword(payload: ResetPasswordPayload) {
  return api.post('/auth/reset-password', payload)
}

export function resendVerificationEmail() {
  return api.post('/email/resend')
}
