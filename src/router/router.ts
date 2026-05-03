import { createRouter, createWebHistory } from 'vue-router'

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
      { path: 'dashboard', component: Dashboard },
      { path: 'article/edit', component: ArticleRedactor },
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
      { path: 'a/upload', component: ProgramAForm },
      { path: 'b/upload', component: ProgramBForm },
    ]
  },
  { path: '/pending-verification', component: () => import('../views/PendingVerification.vue') },
  { path: '/verified', component: () => import('../views/Verified.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})
router.beforeEach((to, _, next) => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  const status = user ? JSON.parse(user).status : null

  const protectedRoutes = ['/dashboard', '/programs/a/upload', '/programs/b/upload']
  const isProtected = protectedRoutes.some(r => to.path.startsWith(r))

  if (isProtected && !token) {
    next('/auth/login')
  } else if (isProtected && status === 'pending_verification') {
    next('/pending-verification')
  } else {
    next()
  }
})
export default router