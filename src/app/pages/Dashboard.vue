<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/features/auth/stores/auth'
import { getRoleStatus } from '@/features/auth/api/auth'

import StudentDashboard from '@/features/student/components/StudentDashboard.vue'
import CompanyDashboard from '@/features/company/components/CompanyDashboard.vue'
import AdminDashboard from '@/features/admin/components/AdminDashboard.vue'
import EvaluatorDashboard from '@/features/evaluation/components/EvaluatorDashboard.vue'
import MentorDashboard from '@/features/mentor/components/MentorDashboard.vue'

const { t } = useI18n()
const authStore = useAuthStore()

const { 
  role: roleSlug, 
  isStudent, 
  isCompany, 
  isAdmin, 
  roleInOrg, 
  dashboardLabel 
} = storeToRefs(authStore)

const profileComplete = ref(true)
const roleApproved = ref(true)
const success = ref('')
const error = ref('')

async function fetchData() {
  const roleRes = await getRoleStatus()
  roleApproved.value = roleRes.data.approved
}

const profileRoute: Record<string, string> = {
  student: '/profile',
  mentor:  '/mentor-profile',
  company: '/company-profile',
}

onMounted(() => { fetchData() })
</script>

<template>
  <div class="bg-blue-950 absolute rounded-full h-96 w-96 -z-10 -right-20 -top-10"></div>

  <div class="mb-10">
    <div class="inline-flex items-center bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-5">
      {{ dashboardLabel }}
    </div>
    <h1 class="font-bold text-5xl leading-tight mb-3">
      {{ t('dashboard.welcome') }}, <span class="text-blue-400">{{ authStore.user.first_name ?? authStore.user.email }}</span>
    </h1>
    <div class="flex items-center gap-3 mt-2">
      <span class="text-sm text-gray-500">{{ authStore.user.email }}</span>
      <span class="text-slate-700">·</span>
      <span class="text-xs capitalize bg-blue-600/15 border border-blue-800 text-blue-400 px-2.5 py-0.5 rounded-full">
        {{ authStore.role ?? t('dashboard.status.unknown') }}
      </span>
      <span class="text-slate-700">·</span>
      <span :class="[
        'text-xs px-2.5 py-0.5 rounded-full border',
        authStore.user.status === 'active'
          ? 'bg-green-900/30 border-green-800 text-green-400'
          : 'bg-yellow-900/30 border-yellow-800 text-yellow-400'
      ]">
        {{ authStore.user.status ? t(`dashboard.status.${authStore.user.status}`) : t('dashboard.status.pending') }}
      </span>
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

  <div v-if="roleApproved && !profileComplete && roleSlug && ['student','mentor','company'].includes(roleSlug)"
        class="border border-yellow-800/50 bg-yellow-900/10 rounded-xl px-6 py-4 flex items-center justify-between gap-4 mb-8">
    <div>
      <div class="text-sm font-semibold text-yellow-400 mb-1">{{ t('dashboard.alerts.complete_profile_title') }}</div>
      <div class="text-muted-sm">{{ t('dashboard.alerts.complete_profile_desc') }}</div>
    </div>
    <router-link :to="profileRoute[roleSlug] ?? '/dashboard'"
                  class="bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap">
      {{ t('dashboard.alerts.complete_now_btn') }}
    </router-link>
  </div>

  <StudentDashboard v-if="isStudent"/>

  <MentorDashboard v-if="roleSlug === 'mentor'"/>
    
  <EvaluatorDashboard v-if="roleSlug === 'evaluator'"/>

  <CompanyDashboard v-if="isCompany" :role-in-org="roleInOrg"/>

  <AdminDashboard v-if="isAdmin" :user-role="roleSlug" />
</template>