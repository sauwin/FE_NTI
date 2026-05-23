import type { RouteRecordRaw } from 'vue-router'

export const applicationRoutes: RouteRecordRaw[] = [
  {
    path: '/applications/:id',

    component: () =>
      import('@/features/applications/pages/ApplicationView.vue'),

    meta: {
      requiresAuth: true,
    },
  },

  {
    path: '/applications/:id/edit',

    component: () =>
      import('@/features/applications/pages/ApplicationEdit.vue'),

    meta: {
      requiresAuth: true,
    },
  },
]