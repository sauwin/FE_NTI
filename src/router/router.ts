import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '../layouts/MainLayout.vue'
import AuthLayout from '../layouts/AuthLayout.vue'

import Home from '../views/Home.vue'
import About from '../views/About.vue'
import FAQ from '../views/FAQ.vue'
import ProgramA from '../views/ProgramA.vue'
import ProgramB from '../views/ProgramB.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'

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
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router