<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/features/auth/stores/auth'
import { getMe, getRoleStatus, logout as authLogout } from '@/features/auth/api/auth'
import { getApplications } from '@/features/applications/api/applications'
import { getProfile } from '@/features/student/api/profile'
import { getMentorProfile } from '@/features/mentor/api/profile'
import { getCompanyProfile } from '@/features/company/api/company'
import type { AuthUser } from '@/features/auth/types/auth'

import StudentDashboard from '@/features/student/components/StudentDashboard.vue'
import CompanyDashboard from '@/features/company/components/CompanyDashboard.vue'
import AdminDashboard from '@/features/admin/components/AdminDashboard.vue'
import EvaluatorDashboard from '@/features/evaluation/components/EvaluatorDashboard.vue'
import MentorDashboard from '@/features/mentor/components/MentorDashboard.vue'
import PendingApproval from '@/features/auth/pages/PendingApproval.vue'

const router = useRouter()
const authStore = useAuthStore()

const { 
  role: roleSlug, 
  isStudent, 
  isCompany, 
  isAdmin, 
  roleInOrg, 
  dashboardLabel 
} = storeToRefs(authStore)

const isAuthentified = ref(false)
const userObj = ref<AuthUser | null>(null)
const profileComplete = ref(true)
const roleApproved = ref(true)
const showTeamForm = ref(false)
const success = ref('')

const applications = ref<any[]>([])
const error = ref('')

async function fetchData() {
  try {
    const res = await getMe()
    userObj.value = res.data
    isAuthentified.value = true
    
    authStore.user = res.data 
    localStorage.setItem('user', JSON.stringify(res.data))

    const appRes = await getApplications()
    applications.value = appRes.data
    const roleRes = await getRoleStatus()
    roleApproved.value = roleRes.data.approved

    if (isStudent.value) {
      try {
        const p = await getProfile()
        profileComplete.value = !!p.data
      } catch { profileComplete.value = false }
    } else if (roleSlug.value === 'mentor') {
      try {
        const p = await getMentorProfile()
        profileComplete.value = !!p.data
      } catch { profileComplete.value = false }
    } else if (isCompany.value) {
      try {
        const p = await getCompanyProfile()
        profileComplete.value = !!p.data
      } catch { profileComplete.value = false }
    }
  } catch {
    isAuthentified.value = false
  }
}

const profileRoute: Record<string, string> = {
  student: '/profile',
  mentor:  '/mentor-profile',
  company: '/company-profile',
}

onMounted(() => { fetchData() })
</script>

<template>
  <div class="container-main">
    <div class="bg-blue-950 absolute rounded-full h-96 w-96 -z-10 -right-20 -top-10"></div>

    <div v-if="!isAuthentified" class="flex flex-col items-center justify-center py-32 gap-4">
      <p class="text-gray-400 text-base">User is not logged in</p>
      <router-link to="/auth/login"
                   class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
        Go to Login
      </router-link>
    </div>

    <div v-else>

      <div class="mb-10">
        <div class="inline-flex items-center bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-5">
          {{ dashboardLabel }}
        </div>
        <h1 class="font-bold text-5xl leading-tight mb-3">
          Welcome, <span class="text-blue-400">{{ userObj?.first_name ?? userObj?.email }}</span>
        </h1>
        <div class="flex items-center gap-3 mt-2">
          <span class="text-sm text-gray-500">{{ userObj?.email }}</span>
          <span class="text-slate-700">·</span>
          <span class="text-xs capitalize bg-blue-600/15 border border-blue-800 text-blue-400 px-2.5 py-0.5 rounded-full">
            {{ roleSlug ?? '—' }}
          </span>
          <span class="text-slate-700">·</span>
          <span :class="[
            'text-xs px-2.5 py-0.5 rounded-full border',
            userObj?.status === 'active'
              ? 'bg-green-900/30 border-green-800 text-green-400'
              : 'bg-yellow-900/30 border-yellow-800 text-yellow-400'
          ]">{{ userObj?.status ?? 'pending' }}</span>
        </div>
      </div>

      <div v-if="error" class="border border-red-800/50 bg-red-900/10 rounded-xl px-6 py-4 mb-8 flex items-center justify-between gap-4">
        <div class="text-sm text-red-400">{{ error }}</div>
        <button @click="error = ''" class="text-red-400 hover:text-red-300">×</button>
      </div>

      <div v-if="success" class="border border-green-800/50 bg-green-900/10 rounded-xl px-6 py-4 mb-8 flex items-center justify-between gap-4">
        <div class="text-sm text-green-400">{{ success }}</div>
        <button @click="success = ''" class="text-green-400 hover:text-green-300">×</button>
      </div>

      <div v-if="!roleApproved"
           class="border border-orange-800/50 bg-orange-900/10 rounded-xl px-6 py-4 flex items-center justify-between gap-4 mb-8">
        <div>
          <div class="text-sm font-semibold text-orange-400 mb-1">Role pending approval</div>
          <div class="text-muted-sm">An NTI administrator will confirm your role. You will be notified by email.</div>
        </div>
      </div>

      <div v-if="roleApproved && !profileComplete && roleSlug && ['student','mentor','company'].includes(roleSlug)"
           class="border border-yellow-800/50 bg-yellow-900/10 rounded-xl px-6 py-4 flex items-center justify-between gap-4 mb-8">
        <div>
          <div class="text-sm font-semibold text-yellow-400 mb-1">Complete your profile</div>
          <div class="text-muted-sm">Fill in your profile before using the full platform</div>
        </div>
        <router-link :to="profileRoute[roleSlug] ?? '/dashboard'"
                     class="bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap">
          Complete now
        </router-link>
      </div>

      <StudentDashboard v-if="isStudent"/>

      <MentorDashboard v-if="roleSlug === 'mentor'"/>
        
      <EvaluatorDashboard v-if="roleSlug === 'evaluator'"/>

      <CompanyDashboard v-if="isCompany" :role-in-org="roleInOrg"/>

      <AdminDashboard v-if="isAdmin" :user-role="roleSlug" />
    </div>
  </div>
</template>