import type { RouteRecordRaw } from 'vue-router'

export const evaluationRoutes: RouteRecordRaw[] = [
    {
        path: '/evaluations/application/:applicationId',
        component: () => import('@/features/evaluation/components/EvaluationForm.vue'),
        meta: { requiresAuth: true },
    },
]