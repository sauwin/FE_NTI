<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  getAdminApplications,
  getAdminUsers,
  getAdminMentorships,
  assignMentorship,
  deleteMentorship,
  updateAdminApplicationStatus,
} from '@/features/admin/api/admin'
import { getApplicationById } from '@/features/applications/api/applications'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const applications = ref<any[]>([])
const selectedApplicationId = ref<number | null>(null)
const mentors = ref<any[]>([])
const allUsers = ref<any[]>([])
const selectedUserId = ref<number | null>(null)
const loading = ref(false)
const error = ref('')
const success = ref('')

const mentorshipStatusList = ['approved', 'onboarding', 'active', 'suspended']

onMounted(async () => {
  try {
    const [appsRes, usersRes] = await Promise.all([
      getAdminApplications({ per_page: 1000 }),
      getAdminUsers(),
    ])
    
    let appsList = appsRes.data?.data ?? appsRes.data ?? []
    applications.value = appsList.filter((app: any) => mentorshipStatusList.includes(app.status))
    
    let usersList = usersRes.data?.data ?? usersRes.data ?? []
    allUsers.value = usersList.filter((u: any) =>
      u.roles?.some((r: any) => r.slug === 'mentor')
    )
  } catch {
    error.value = t('admin.mentorsManager.errors.loadDataFailed')
  }
})

async function loadMentors() {
  if (!selectedApplicationId.value) return
  loading.value = true
  try {
    const res = await getAdminMentorships({ application_id: selectedApplicationId.value })
    let mentorsList = res.data?.data ?? res.data ?? []
    mentors.value = mentorsList.filter((m: any) => m.application?.id === selectedApplicationId.value)
  } catch {
    error.value = t('admin.mentorsManager.errors.loadMentorsFailed')
  } finally {
    loading.value = false
  }
}

async function assign() {
  if (!selectedApplicationId.value || !selectedUserId.value) return
  error.value = ''
  success.value = ''
  
  try {
    const app = applications.value.find(a => a.id === selectedApplicationId.value)
    if (!app) {
      error.value = t('admin.mentorsManager.errors.appNotFound')
      return
    }

    const appDetailsRes = await getApplicationById(selectedApplicationId.value)
    const student_id = appDetailsRes.data?.student_profile?.user_id
    const currentStatus = appDetailsRes.data?.status

    if (!student_id) {
      error.value = t('admin.mentorsManager.errors.studentNotFound')
      return
    }

    await assignMentorship({
      application_id: selectedApplicationId.value,
      mentor_id: selectedUserId.value,
      student_id: student_id,
    })

    let statusChangedNotice = ''

    if (currentStatus === 'approved') {
      await updateAdminApplicationStatus(selectedApplicationId.value, 'onboarding')
      
      app.status = 'onboarding'
      statusChangedNotice = t('admin.mentorsManager.success.noticeOnboarding')
    }

    success.value = t('admin.mentorsManager.success.assigned', { notice: statusChangedNotice })
    selectedUserId.value = null
    await loadMentors()
    setTimeout(() => (success.value = ''), 4000)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? t('admin.mentorsManager.errors.assignFailed')
  }
}

async function remove(mentorshipId: number) {
  if (!selectedApplicationId.value) return
  error.value = ''
  success.value = ''
  
  try {
    await deleteMentorship(mentorshipId)
    
    mentors.value = mentors.value.filter(m => m.id !== mentorshipId)
    
    let statusChangedNotice = ''

    if (mentors.value.length === 0) {
      const app = applications.value.find(a => a.id === selectedApplicationId.value)
      
      if (app && app.status === 'onboarding') {
        await updateAdminApplicationStatus(selectedApplicationId.value, 'active')
        
        app.status = 'active'
        statusChangedNotice = t('admin.mentorsManager.success.noticeActive')
      }
    }

    success.value = t('admin.mentorsManager.success.removed', { notice: statusChangedNotice })
    setTimeout(() => (success.value = ''), 4000)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? t('admin.mentorsManager.errors.removeFailed')
  }
}
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    <h3 class="text-xl font-bold text-white mb-6">{{ t('admin.mentorsManager.title') }}</h3>

    <p v-if="error" class="text-red-400 text-sm mb-4">{{ error }}</p>
    <p v-if="success" class="text-green-400 text-sm mb-4">{{ success }}</p>

    <div class="flex gap-3 mb-6 flex-wrap">
      <select
        v-model="selectedApplicationId"
        @change="loadMentors"
        class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none"
      >
        <option :value="null" disabled>{{ t('admin.mentorsManager.dropdowns.selectApp') }}</option>
        <option v-for="app in applications" :key="app.id" :value="app.id">
          {{ app.team_name !== 'Jednotlivec' ? app.team_name : app.applicant_name }} - {{ t('admin.mentorsManager.appFormat.program') }} {{ app.program_type }} (#{{ app.id }})
        </option>
      </select>
    </div>

    <div v-if="selectedApplicationId">
      <div class="flex gap-3 mb-6 flex-wrap items-center">
        <select
          v-model="selectedUserId"
          class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none"
        >
          <option :value="null" disabled>{{ t('admin.mentorsManager.dropdowns.selectMentor') }}</option>
          <option v-for="u in allUsers" :key="u.id" :value="u.id">{{ u.first_name }} {{ u.last_name }} ({{ u.email }})</option>
        </select>
        <button
          @click="assign"
          :disabled="!selectedUserId"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {{ t('admin.mentorsManager.buttons.assign') }}
        </button>
      </div>

      <div v-if="loading" class="text-slate-500 animate-pulse text-sm">{{ t('admin.mentorsManager.status.loading') }}</div>

      <div v-else-if="mentors.length === 0" class="text-slate-500 text-sm">{{ t('admin.mentorsManager.status.empty') }}</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="text-xs text-slate-400 uppercase font-mono bg-slate-900/50">
            <tr>
              <th class="px-4 py-3">{{ t('admin.mentorsManager.table.name') }}</th>
              <th class="px-4 py-3">{{ t('admin.mentorsManager.table.email') }}</th>
              <th class="px-4 py-3">{{ t('admin.mentorsManager.table.assignedAt') }}</th>
              <th class="px-4 py-3 text-right">{{ t('admin.mentorsManager.table.action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mentor in mentors" :key="mentor.id" class="border-b border-slate-800 hover:bg-slate-800/30 transition">
              <td class="px-4 py-3 text-white">{{ mentor.mentor?.name }}</td>
              <td class="px-4 py-3 text-slate-400">{{ mentor.mentor?.email }}</td>
              <td class="px-4 py-3 text-slate-500 text-xs">{{ mentor.assigned_at ? new Date(mentor.assigned_at).toLocaleDateString() : '—' }}</td>
              <td class="px-4 py-3 text-right">
                <button @click="remove(mentor.id)" class="text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-3 py-1.5 rounded-lg transition">
                  {{ t('admin.mentorsManager.buttons.remove') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>