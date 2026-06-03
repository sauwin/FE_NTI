import type { RouteRecordRaw } from 'vue-router'

export const evaluationRoutes: RouteRecordRaw[] = [
    {
        path: '/evaluations/application/:applicationId',
        component: () => import('@/features/evaluation/pages/EvaluationForm.vue'),
        meta: { requiresAuth: true },
    },

    {
        path: '/evaluations/application/:applicationId/final-verdict',
        component: () => import('@/features/admin/pages/FinalVerdictPanel.vue'),
        meta: { requiresAuth: true },
    }
]