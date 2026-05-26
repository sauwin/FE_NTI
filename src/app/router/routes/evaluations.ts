import type { RouteRecordRaw } from 'vue-router'

export const evaluationRoutes: RouteRecordRaw[] = [
    {
        path: '/evaluations/application/:applicationId',
        component: () => import('@/features/evaluation/pages/EvaluationForm.vue'),
        meta: { requiresAuth: true },
    },
]