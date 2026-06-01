import type { RouteRecordRaw } from 'vue-router'
import FormLayout from '@/app/layouts/FormLayout.vue'

export const articlesRoutes: RouteRecordRaw = {
  path: '/article',
  component: FormLayout,

  children: [
    {
      path: ':id',
      component: () => import('@/features/articles/pages/ArticleView.vue'),
    },

    {
      path: 'create',
      component: () => import('@/features/articles/pages/ArticleRedactor.vue'),
    },

    {
      path: 'edit/:id',
      component: () => import('@/features/articles/pages/ArticleRedactor.vue'),
    },
  ],
}