<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/shared/api/axios.ts'

const applications = ref<any[]>([])
const selectedApplicationId = ref<number | null>(null)
const mentors = ref<any[]>([])
const allUsers = ref<any[]>([])
const selectedUserId = ref<number | null>(null)
const loading = ref(false)
const error = ref('')
const success = ref('')

onMounted(async () => {
  try {
    const [appsRes, usersRes] = await Promise.all([
      api.get('/admin/applications', { params: { per_page: 1000 } }),
      api.get('/admin/users'),
    ])
    
    // Handle paginated response
    let appsList = appsRes.data?.data ?? appsRes.data ?? []
    applications.value = appsList.filter((app: any) => app.status === 'approved')
    
    // Handle paginated response
    let usersList = usersRes.data?.data ?? usersRes.data ?? []
    allUsers.value = usersList.filter((u: any) =>
      u.roles?.some((r: any) => r.slug === 'mentor')
    )
  } catch {
    error.value = 'Could not load data'
  }
})

async function loadMentors() {
  if (!selectedApplicationId.value) return
  loading.value = true
  try {
    const res = await api.get('/admin/mentorships', { params: { application_id: selectedApplicationId.value } })
    
    let mentorsList = res.data?.data ?? res.data ?? []
    
    // Filter for mentorships of the selected application
    mentors.value = mentorsList.filter((m: any) => m.application?.id === selectedApplicationId.value)
  } catch {
    error.value = 'Could not load mentors'
  } finally {
    loading.value = false
  }
}

async function assign() {
  if (!selectedApplicationId.value || !selectedUserId.value) return
  error.value = ''
  try {
    const app = applications.value.find(a => a.id === selectedApplicationId.value)
    if (!app) {
      error.value = 'Application not found'
      return
    }

    // Fetch application details to get user_id
    const appDetailsRes = await api.get(`/admin/applications/${selectedApplicationId.value}`)
    const student_id = appDetailsRes.data?.application?.student_profile.user_id

    if (!student_id) {
      error.value = 'Could not determine student for this application'
      return
    }

    await api.post('/mentorships/assign', {
      application_id: selectedApplicationId.value,
      mentor_id: selectedUserId.value,
      student_id: student_id
    })
    success.value = 'Mentor assigned.'
    selectedUserId.value = null
    await loadMentors()
    setTimeout(() => (success.value = ''), 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Could not assign mentor'
  }
}

async function remove(mentorshipId: number) {
  if (!selectedApplicationId.value) return
  error.value = ''
  try {
    // Note: You may need to create a delete endpoint for mentorships
    await api.delete(`/mentorships/${mentorshipId}`)
    mentors.value = mentors.value.filter(m => m.id !== mentorshipId)
    success.value = 'Mentor removed.'
    setTimeout(() => (success.value = ''), 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Could not remove mentor'
  }
}
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    <h3 class="text-xl font-bold text-white mb-6">Application Mentors</h3>

    <p v-if="error" class="text-red-400 text-sm mb-4">{{ error }}</p>
    <p v-if="success" class="text-green-400 text-sm mb-4">{{ success }}</p>

    <div class="flex gap-3 mb-6 flex-wrap">
      <select
        v-model="selectedApplicationId"
        @change="loadMentors"
        class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none"
      >
        <option :value="null" disabled>Select application...</option>
        <option v-for="app in applications" :key="app.id" :value="app.id">
          {{ app.team_name !== 'Jednotlivec' ? app.team_name : app.applicant_name }} - Program {{ app.program_type }} (#{{ app.id }})
        </option>
      </select>
    </div>

    <div v-if="selectedApplicationId">
      <div class="flex gap-3 mb-6 flex-wrap items-center">
        <select
          v-model="selectedUserId"
          class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none"
        >
          <option :value="null" disabled>Select mentor to assign...</option>
          <option v-for="u in allUsers" :key="u.id" :value="u.id">{{ u.first_name }} {{ u.last_name }} ({{ u.email }})</option>
        </select>
        <button
          @click="assign"
          :disabled="!selectedUserId"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Assign
        </button>
      </div>

      <div v-if="loading" class="text-slate-500 animate-pulse text-sm">Loading mentors...</div>

      <div v-else-if="mentors.length === 0" class="text-slate-500 text-sm">No mentors assigned to this application.</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="text-xs text-slate-400 uppercase font-mono bg-slate-900/50">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Assigned at</th>
              <th class="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mentor in mentors" :key="mentor.id" class="border-b border-slate-800 hover:bg-slate-800/30 transition">
              <td class="px-4 py-3 text-white">{{ mentor.mentor?.name }}</td>
              <td class="px-4 py-3 text-slate-400">{{ mentor.mentor?.email }}</td>
              <td class="px-4 py-3 text-slate-500 text-xs">{{ mentor.assigned_at ? new Date(mentor.assigned_at).toLocaleDateString() : '—' }}</td>
              <td class="px-4 py-3 text-right">
                <button @click="remove(mentor.id)" class="text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-3 py-1.5 rounded-lg transition">
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
