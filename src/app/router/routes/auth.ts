import type { RouteRecordRaw } from 'vue-router'
import FormLayout from '@/app/layouts/FormLayout.vue'

export const authRoutes: RouteRecordRaw = {
  path: '/auth',
  component: FormLayout,

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