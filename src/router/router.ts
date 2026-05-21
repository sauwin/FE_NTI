import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import MainLayout from '../layouts/MainLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import FormLayout from '../layouts/FormLayouts.vue'

import Home from '../views/Home.vue'
import About from '../views/About.vue'
import FAQ from '../views/FAQ.vue'
import ProgramA from '../views/ProgramA.vue'
import ProgramB from '../views/ProgramB.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import ArticleRedactor from '../views/ArticleRedactor.vue'
import ProgramAForm from '../views/ProgramAForm.vue'
import ProgramBForm from '../views/ProgramBForm.vue'
import StudentProfile from '../views/StudentProfile.vue'
import MentorProfile from '../views/MentorProfile.vue'
import ArticleView from '../views/ArticleView.vue'
import CompanyTaskForm from '../views/CompanyTaskForm.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: Home },
      { path: 'about', component: About },
      { path: 'faq', component: FAQ },
      { path: 'privacy', component: () => import('../views/Privacy.vue') },
      { path: 'terms', component: () => import('../views/Terms.vue') },
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
      { path: 'forgot-password', component: () => import('../views/ForgotPassword.vue') },
      { path: 'reset-password', component: () => import('../views/ResetPassword.vue') },
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
  { path: '/applications/:id', component: () => import('../views/ApplicationView.vue'), meta: { requiresAuth: true } },
  { path: '/applications/:id/edit', component: () => import('../views/ApplicationEdit.vue'), meta: { requiresAuth: true } },
  { path: '/pending-verification', component: () => import('../views/PendingVerification.vue') },
  { path: '/pending-approval', component: () => import('../views/PendingApproval.vue') },
  { path: '/unauthorized', component: () => import('../views/Unauthorized.vue') },
  { path: '/verified', component: () => import('../views/Verified.vue') },
  { path: '/profile/complete', component: () => import('../views/ProfileComplete.vue'), meta: { requiresAuth: true } },
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
      const { default: api } = await import('../api/axios')
      const res = await api.get('/profile/student')
      if (!res.data) return '/profile/complete'
    } catch {
      return '/profile/complete'
    }
  }

  return true
})

export default router