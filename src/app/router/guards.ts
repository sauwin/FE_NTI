import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import { getStudentProfile } from '@/features/student/api/profile'
import type { AppRouteMeta } from './types'

async function hasStudentProfile() {
  try {
    const res = await getStudentProfile()

    return Boolean(res.data)
  } catch {
    return false
  }
}

export async function authGuard(to: RouteLocationNormalized) {
  const auth = useAuthStore()
  const meta = to.meta as AppRouteMeta

  if (meta.requiresAuth && !auth.isLoggedIn) {
    return '/auth/login'
  }

  if (
    meta.requiresAuth &&
    auth.user?.status === 'pending_verification'
  ) {
    return '/pending-verification'
  }

  if (
    meta.requiresAuth &&
    auth.user?.status === 'pending_approval'
  ) {
    return '/pending-approval'
  }

  if (meta.role && auth.role !== meta.role) {
    return '/unauthorized'
  }

  if (meta.requiresProfile && auth.isStudent) {
    const profileExists = await hasStudentProfile()

    if (!profileExists) {
      return '/profile/complete'
    }
  }

  return true
}