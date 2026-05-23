import type { RouteRecordRaw } from 'vue-router'

export const profileRoutes: RouteRecordRaw[] = [
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