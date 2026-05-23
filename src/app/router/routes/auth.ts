import type { RouteRecordRaw } from 'vue-router'
import AuthLayout from '@/app/layouts/AuthLayout.vue'

export const authRoutes: RouteRecordRaw = {
  path: '/auth',
  component: AuthLayout,

  children: [
    {
      path: 'login',
      component: () => import('@/features/auth/pages/Login.vue'),
    },

    {
      path: 'register',
      component: () => import('@/features/auth/pages/Register.vue'),
    },

    {
      path: 'forgot-password',
      component: () => import('@/features/auth/pages/ForgotPassword.vue'),
    },

    {
      path: 'reset-password',
      component: () => import('@/features/auth/pages/ResetPassword.vue'),
    },
  ],
}