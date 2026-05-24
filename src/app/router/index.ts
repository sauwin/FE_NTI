import { createRouter, createWebHistory } from 'vue-router'

import { authGuard } from './guards'

import { publicRoutes } from './routes/public'
import { authRoutes } from './routes/auth'
import { programRoutes } from './routes/programs'
import { applicationRoutes } from './routes/applications'
import { profileRoutes } from './routes/profile'
import { evaluationRoutes } from './routes/evaluations'

const router = createRouter({
  history: createWebHistory(),

  routes: [
    publicRoutes,
    authRoutes,
    programRoutes,

    ...applicationRoutes,
    ...profileRoutes,
    ...evaluationRoutes,

    {
      path: '/pending-verification',
      component: () =>
        import('@/features/auth/pages/PendingVerification.vue'),
    },

    {
      path: '/pending-approval',
      component: () =>
        import('@/features/auth/pages/PendingApproval.vue'),
    },

    {
      path: '/unauthorized',
      component: () =>
        import('@/features/auth/pages/Unauthorized.vue'),
    },

    {
      path: '/verified',
      component: () =>
        import('@/features/auth/pages/Verified.vue'),
    },
  ],
})

router.beforeEach(authGuard)

export default router