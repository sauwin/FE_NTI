<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from '@/shared/composables/useConfirm'
import { getApplications, deleteApplication, submitApplication } from '@/features/applications/api/applications'
import type { StudentApplication } from '@/features/applications/types/applications'

const router = useRouter()

const loading = ref(false)
const submittingId = ref<number | string | null>(null)
const applications = ref<StudentApplication[]>([])
const error = ref('')

const filterProgram = ref<string>('all')
const filterStatus = ref<string>('all')

async function fetchApplications() {
  loading.value = true
  error.value = ''
  try {
    const res = await getApplications()
    applications.value = res.data
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to load applications.'
  } finally {
    loading.value = false
  }
}

const ALL_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'formally_verified', label: 'Formally Verified' },
  { value: 'under_evaluation', label: 'Under Evaluation' },
  { value: 'pending_revision', label: 'Pending Revision' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' },
]

function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-slate-800 text-slate-400 border-slate-700',
    submitted: 'bg-blue-900/40 text-blue-400 border-blue-800',
    formally_verified: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    under_evaluation: 'bg-indigo-900/40 text-indigo-400 border-indigo-800',
    approved: 'bg-green-900/40 text-green-400 border-green-800',
    active: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    rejected: 'bg-red-900/40 text-red-400 border-red-800',
    pending_revision: 'bg-purple-900/40 text-purple-400 border-purple-800',
    onboarding: 'bg-orange-900/40 text-orange-400 border-orange-800',
    suspended: 'bg-rose-900/40 text-rose-400 border-rose-800',
    closed: 'bg-rose-900/40 text-rose-600 border-rose-900',
  }
  return map[status] ?? 'bg-slate-800 text-slate-400 border-slate-700'
}

function formatDate(dateString: string): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('sk-SK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const filteredApplications = computed(() => {
  return applications.value.filter(app => {
    const matchProgram = filterProgram.value === 'all' || app.program_type.toLowerCase() === filterProgram.value.toLowerCase()
    const matchStatus = filterStatus.value === 'all' || app.status === filterStatus.value
    return matchProgram && matchStatus
  })
})

function viewDetails(id: number) {
  router.push(`/applications/${id}`)
}

function editApplication(id: number) {
  router.push(`/applications/${id}/edit`)
}

async function submitApp(id: number | string) {
  const confirmed = await useConfirm({
    title: 'Submit Application',
    message: 'Are you sure you want to finalize and submit this application? You will not be able to edit it until review.',
    confirmText: 'Submit Now',
    cancelText: 'Cancel',
    danger: false,
  })
  if (!confirmed) return

  submittingId.value = id
  error.value = ''
  try {
    await submitApplication(id)
    await fetchApplications()
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Could not submit application.'
  } finally {
    submittingId.value = null
  }
}

async function deleteApp(id: number | string) {
  const confirmed = await useConfirm({
    title: 'Delete Application',
    message: 'Delete this application? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true,
  })
  if (!confirmed) return

  try {
    await deleteApplication(id)
    await fetchApplications()
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Could not delete application'
  }
}

onMounted(() => {
  fetchApplications()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-xl font-bold text-white">Moje prihlášky (My Applications)</h3>
        <p class="text-sm text-slate-500 mt-1">Prehľad a sledovanie stavu vašich odoslaných projektov a prihlášok.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl">
      <div class="sm:col-span-2 flex flex-col gap-1.5">
        <label class="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">Program</label>
        <select 
          v-model="filterProgram" 
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer"
        >
          <option value="all">Všetky programy (All Programs)</option>
          <option value="a">Program A</option>
          <option value="b">Program B</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">Stav (Status)</label>
        <select 
          v-model="filterStatus" 
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer"
        >
          <option value="all">Všetky stavy (All Statuses)</option>
          <option v-for="s in ALL_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>

      <button 
        @click="fetchApplications" 
        class="text-slate-400 text-xs font-mono font-medium hover:text-white border border-slate-800 bg-slate-950 px-4 py-2 rounded-lg transition h-[38px] flex items-center justify-center gap-2 cursor-pointer"
      >
        Refresh
      </button>
    </div>

    <!-- СТАН ЗАВАНТАЖЕННЯ -->
    <div v-if="loading" class="text-slate-500 animate-pulse py-6 font-mono text-sm">
      Loading data...
    </div>

    <div v-else>
      <div v-if="error" class="text-xs font-mono text-red-400 bg-red-950/20 border border-red-900/40 p-4 rounded-xl mb-4">
        System Error: {{ error }}
      </div>

      <div v-if="filteredApplications.length === 0" class="border border-slate-800 border-dashed rounded-2xl p-12 text-center bg-slate-900/10">
        <p class="text-slate-400 text-base font-medium">Nenašli sa žiadne prihlášky.</p>
        <p class="text-slate-600 text-xs mt-1.5 font-mono">No official applications containers found in registry.</p>
      </div>

      <div v-else class="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/20">
        <table class="w-full text-left border-collapse text-sm text-slate-300">
          <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
            <tr class="border-b border-slate-800">
              <th class="px-4 py-3">ID</th>
              <th class="px-4 py-3">Applicant Type</th>
              <th class="px-4 py-3">Program / Call</th>
              <th class="px-4 py-3">Created At</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/40">
            <tr 
              v-for="app in filteredApplications" 
              :key="app.id" 
              class="border-b border-slate-800/60 hover:bg-slate-800/30 transition"
            >
              <!-- ID -->
              <td class="px-4 py-4 font-mono text-slate-500">#{{ app.id }}</td>

              <!-- APPLICANT TYPE -->
              <td class="px-4 py-4">
                <div class="font-semibold text-white capitalize">{{ app.applicant_type }} Container</div>
                <div class="text-xs text-slate-500 font-mono">ID: user_linked_scope</div>
              </td>

              <td class="px-4 py-4">
                <span 
                  class="font-mono px-1.5 py-0.5 rounded border text-[10px] mr-1 uppercase" 
                  :class="app.program_type.toLowerCase() === 'a' 
                    ? 'bg-blue-950/60 text-blue-400 border-blue-900' 
                    : 'bg-indigo-950/60 text-indigo-400 border-indigo-900'"
                >
                  Program {{ app.program_type }}
                </span>
                <div class="text-slate-500 text-xs mt-1 font-mono">Call ID: {{ app.call_id }}</div>
              </td>

              <td class="px-4 py-4 font-mono text-slate-400 text-xs">
                {{ formatDate(app.created_at ?? '') }}
              </td>

              <td class="px-4 py-4">
                <span 
                  :class="statusColor(app.status)" 
                  class="text-[10px] px-2 py-1 rounded border font-mono uppercase whitespace-nowrap tracking-wider"
                >
                  {{ app.status }}
                </span>
              </td>

              <td class="px-4 py-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-2">
                  
                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="submitApp(app.id)"
                    :disabled="submittingId === app.id"
                    class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono cursor-pointer disabled:opacity-40"
                  >
                    {{ submittingId === app.id ? '...' : 'Submit 🚀' }}
                  </button>

                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="editApplication(app.id)"
                    :disabled="submittingId === app.id"
                    class="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-40 font-mono"
                  >
                    Edit
                  </button>

                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="deleteApp(app.id)"
                    :disabled="submittingId === app.id"
                    class="text-xs bg-red-900/20 hover:bg-red-900/40 px-3 py-1.5 rounded border border-red-900/60 text-red-400 transition cursor-pointer disabled:opacity-40 font-mono"
                  >
                    Delete
                  </button>

                  <button 
                    @click="viewDetails(app.id)"
                    class="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 text-slate-300 transition cursor-pointer font-mono"
                  >
                    Detail
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>