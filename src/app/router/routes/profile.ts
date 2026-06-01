import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/app/layouts/MainLayout.vue'

export const profileRoutes: RouteRecordRaw = {
  path: '/',
  component: MainLayout,

  children: [
    {
      path: '/profile',

      component: () =>
        import('@/features/student/pages/StudentProfile.vue'),

      meta: {
        requiresAuth: true,
        role: 'student',
      },
    },

    {
      path: '/mentor-profile',

      component: () =>
        import('@/features/mentor/pages/MentorProfile.vue'),

      meta: {
        requiresAuth: true,
        role: 'mentor',
      },
    },

    {
      path: '/profile/complete',

      component: () =>
        import('@/features/student/pages/ProfileComplete.vue'),

      meta: {
        requiresAuth: true,
      },
    },
  ]
} 