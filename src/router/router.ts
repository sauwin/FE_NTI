import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import MainLayout from '../layouts/MainLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'
import FormLayout from '@/layouts/FormLayouts.vue'

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

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: Home },
      { path: 'about', component: About },
      { path: 'faq', component: FAQ },
      { path: 'programs/a', component: ProgramA },
      { path: 'programs/b', component: ProgramB },
      { path: 'dashboard', component: Dashboard,  meta: { requiresAuth: true } },
      { path: 'article/create', component: ArticleRedactor },
      { path: 'article/edit/:id', component: ArticleRedactor },
    ],
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
    ],
  },
  {
    path: '/programs',
    component: FormLayout,
    children: [
      { path: 'a/upload', component: ProgramAForm, meta: { requiresAuth: true, role: 'student' } },
      { path: 'b/upload', component: ProgramBForm, meta: { requiresAuth: true, role: 'company' } },
    ]
  },
  { path: '/pending-verification', component: () => import('../views/PendingVerification.vue') },
  { path: '/pending-approval', component: () => import('../views/PendingApproval.vue') },
  { path: '/verified', component: () => import('../views/Verified.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
router.beforeEach((to, _, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next('/auth/login')
  } else if (to.meta.requiresAuth && auth.user?.status === 'pending_verification') {
    next('/pending-verification')
  } else if (to.meta.role && auth.role !== to.meta.role) {
    next('/unauthorized')
  } else {
    next()
  }
})
export default router