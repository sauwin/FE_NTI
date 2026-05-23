import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/app/layouts/MainLayout.vue'

export const publicRoutes: RouteRecordRaw = {
  path: '/',
  component: MainLayout,

  children: [
    {
      path: '',
      component: () => import('@/app/pages/HomePage.vue'),
    },

    {
      path: 'about',
      component: () => import('@/features/about/pages/About.vue'),
    },

    {
      path: 'faq',
      component: () => import('@/features/faq/pages/FAQ.vue'),
    },

    {
      path: 'privacy',
      component: () => import('@/features/auth/pages/Privacy.vue'),
    },

    {
      path: 'terms',
      component: () => import('@/features/auth/pages/Terms.vue'),
    },

    {
      path: 'dashboard',
      component: () => import('@/app/pages/Dashboard.vue'),
      meta: {
        requiresAuth: true,
      },
    },
  ],
}