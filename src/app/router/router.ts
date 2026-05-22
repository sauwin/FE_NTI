import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'

import MainLayout from '@/app/layouts/MainLayout.vue'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import FormLayout from '@/app/layouts/FormLayout.vue'

import Home from '@/app/pages/HomePage.vue'
import About from '@/features/about/pages/About.vue'
import FAQ from '@/features/faq/pages/FAQ.vue'
import ProgramA from '@/features/program_a/pages/ProgramA.vue'
import ProgramB from '@/features/program_b/pages/ProgramB.vue'
import Login from '@/features/auth/pages/Login.vue'
import Register from '@/features/auth/pages/Register.vue'
import Dashboard from '@/app/pages/Dashboard.vue'
import ArticleRedactor from '@/features/articles/pages/ArticleRedactor.vue'
import ProgramAForm from '@/features/program_a/pages/ProgramAForm.vue'
import ProgramBForm from '@/features/program_b/pages/ProgramBForm.vue'
import StudentProfile from '@/features/student/pages/StudentProfile.vue'
import MentorProfile from '@/features/mentor/pages/MentorProfile.vue'
import ArticleView from '@/features/articles/pages/ArticleView.vue'
import CompanyTaskForm from '@/features/tasks/pages/CompanyTaskForm.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: Home },
      { path: 'about', component: About },
      { path: 'faq', component: FAQ },
      { path: 'privacy', component: () => import('@/features/auth/pages/Privacy.vue') },
      { path: 'terms', component: () => import('@/features/auth/pages/Terms.vue') },
      { path: 'programs/a', component: ProgramA },
      { path: 'programs/b', component: ProgramB },
      { path: 'dashboard', component: Dashboard, meta: { requiresAuth: true }},
      { path: 'article/create', component: ArticleRedactor },
      { path: 'article/edit/:id', component: ArticleRedactor },
      { path: 'article/:id', component: ArticleView },
      { path: 'profile', component: StudentProfile, meta: { requiresAuth: true, role: 'student' }},
      { path: 'mentor-profile', component: MentorProfile, meta: { requiresAuth: true, role: 'mentor' }},
    ],
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: 'forgot-password', component: () => import('@/features/auth/pages/ForgotPassword.vue') },
      { path: 'reset-password', component: () => import('@/features/auth/pages/ResetPassword.vue') },
    ],
  },
  {
    path: '/programs',
    component: FormLayout,
    children: [
      { path: 'a/upload', component: ProgramAForm, meta: { requiresAuth: true, requiresProfile: true, role: 'student' }},
      { path: 'b/upload', component: ProgramBForm, meta: { requiresAuth: true, requiresProfile: true, role: 'student' }},
      { path: 'b/apply/:callOrganizationId', component: ProgramBForm, meta: { requiresAuth: true, requiresProfile: true, role: 'student' }},
      { path: 'b/create-task', component: CompanyTaskForm, meta: { requiresAuth: true, role: 'company' }},
    ],
  },
  { path: '/applications/:id', component: () => import('@/features/applications/pages/ApplicationView.vue'), meta: { requiresAuth: true } },
  { path: '/applications/:id/edit', component: () => import('@/features/applications/pages/ApplicationEdit.vue'), meta: { requiresAuth: true } },
  { path: '/pending-verification', component: () => import('@/features/auth/pages/PendingVerification.vue') },
  { path: '/pending-approval', component: () => import('@/features/auth/pages/PendingApproval.vue') },
  { path: '/unauthorized', component: () => import('@/features/auth/pages/Unauthorized.vue') },
  { path: '/verified', component: () => import('@/features/auth/pages/Verified.vue') },
  { path: '/profile/complete', component: () => import('@/features/student/pages/ProfileComplete.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return '/auth/login'
  }

  if (to.meta.requiresAuth && auth.user?.status === 'pending_verification') {
    return '/pending-verification'
  }

  if (to.meta.role && auth.role !== to.meta.role) {
    return '/unauthorized'
  }

  // Require student profile before applying
  if (to.meta.requiresProfile && auth.isStudent) {
    try {
      const { default: api } = await import('@/shared/api/axios')
      const res = await api.get('/profile/student')
      if (!res.data) return '/profile/complete'
    } catch {
      return '/profile/complete'
    }
  }

  return true
})

export default router