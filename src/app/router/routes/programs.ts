import type { RouteRecordRaw } from 'vue-router'
import FormLayout from '@/app/layouts/FormLayout.vue'

export const programRoutes: RouteRecordRaw = {
  path: '/programs',
  component: FormLayout,

  children: [

    {
      path: 'a/upload',
      component: () => import('@/features/program_a/pages/ProgramAForm.vue'),

      meta: {
        requiresAuth: true,
        requiresProfile: true,
        role: 'student',
      },
    },

    {
      path: 'b/apply/:id',
      component: () => import('@/features/program_b/pages/ProgramBForm.vue'),

      meta: {
        requiresAuth: true,
        requiresProfile: true,
        role: 'student',
      },
    },

    {
      path: 'b/create-task',
      component: () => import('@/features/tasks/pages/CompanyTaskForm.vue'),

      meta: {
        requiresAuth: true,
        role: 'company',
      },
    },

    {
      path: 'b/tasks/:id',
      component: () => import('@/features/tasks/pages/TaskDetailsView.vue'),

      meta: {
        requiresAuth: true,
      },
    },
  ],
}