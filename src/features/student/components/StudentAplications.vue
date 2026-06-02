<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from '@/shared/composables/useConfirm'
import { getApplications, deleteApplication, submitApplication, applyApplicationChanges } from '@/features/applications/api/applications'
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

const statusConfig: Record<string, { text: string; class: string }> = {
  draft: { text: 'Draft', class: 'bg-slate-800 text-slate-300 border-slate-700' },
  submitted: { text: 'Submitted', class: 'bg-blue-950/60 text-blue-400 border-blue-900/80' },
  formal_check: { text: 'Formal Check', class: 'bg-indigo-950/60 text-indigo-400 border-indigo-900/80' },
  formally_verified: { text: 'Verified', class: 'bg-purple-950/60 text-purple-400 border-purple-900/80' },
  under_evaluation: { text: 'In Evaluation', class: 'bg-amber-950/50 text-amber-400 border-amber-900/80' },
  pending_revision: { text: 'Needs Revision', class: 'bg-orange-950/60 text-orange-400 border-orange-900/80' },
  approved: { text: 'Approved', class: 'bg-emerald-950/60 text-emerald-400 border-emerald-900/80' },
  rejected: { text: 'Rejected', class: 'bg-red-950/60 text-red-400 border-red-900/80' },
  onboarding: { text: 'Onboarding', class: 'bg-cyan-950/60 text-cyan-400 border-cyan-900/80' },
  active: { text: 'Active', class: 'bg-green-950/60 text-green-400 border-green-900/80' },
  suspended: { text: 'Suspended', class: 'bg-yellow-950/60 text-yellow-500 border-yellow-900/80' },
  closed: { text: 'Closed', class: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
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
    const matchProgram = filterProgram.value === 'all' || app.program_type === filterProgram.value
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

async function submitApp(id: number | string, status: string) {
  const isRevision = status === 'pending_revision'
  
  const confirmed = await useConfirm({
    title: isRevision ? 'Potvrdiť zmeny (Apply Changes)' : 'Submit Application',
    message: isRevision 
      ? 'Naozaj chcete odoslať opravenú prihlášku na opätovnú kontrolu? Uistite sa, že ste nahrali všetky požadované dokumenty.' 
      : 'Are you sure you want to finalize and submit this application? You will not be able to edit it until review.',
    confirmText: isRevision ? 'Odoslať opravu' : 'Submit Now',
    cancelText: 'Cancel',
    danger: false,
  })
  if (!confirmed) return

  submittingId.value = id
  error.value = ''
  try {
    if (isRevision) {
      await applyApplicationChanges(id)
    } else {
      await submitApplication(id)
    }
    await fetchApplications()
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Could not process application request.'
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
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    
    <!-- Top Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h3 class="text-xl font-bold text-white">My Applications</h3>
        <p class="text-sm text-slate-500 mt-1">
          Overview and status tracking of your submitted projects and applications.
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end w-full mb-6">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-mono uppercase text-slate-500">Program</label>
        <select 
          v-model="filterProgram" 
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all cursor-pointer"
        >
          <option value="all">All Programs</option>
          <option value="a">Program A</option>
          <option value="b">Program B</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-mono uppercase text-slate-500">Status</label>
        <select 
          v-model="filterStatus" 
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option v-for="(cfg, key) in statusConfig" :key="key" :value="key">
            {{ cfg.text }}
          </option>
        </select>
      </div>

      <div class="flex justify-end w-full">
        <button 
          @click="fetchApplications" 
          class="w-full sm:w-auto text-xs bg-slate-900/40 hover:bg-slate-800/50 px-4 py-2 rounded text-slate-400 border border-slate-800 transition-all font-mono h-[38px] cursor-pointer"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="p-3 rounded-lg text-sm mb-6 border bg-red-900/20 border-red-800 text-red-400 font-mono">
      System Error: {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-slate-500 animate-pulse py-12 text-center font-mono text-sm">
      Loading applications...
    </div>

    <!-- Content Table -->
    <div v-else>
      <div v-if="filteredApplications.length === 0" class="border border-slate-800 border-dashed rounded-2xl p-12 text-center bg-slate-900/10">
        <p class="text-slate-400 text-base font-medium">No applications found.</p>
        <p class="text-slate-600 text-xs mt-1.5">You haven't created any drafts or submitted any official applications yet.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
            <tr>
              <th class="px-4 py-3 rounded-tl-lg">ID / Call</th>
              <th class="px-4 py-3">Applicant Type</th>
              <th class="px-4 py-3">Program</th>
              <th class="px-4 py-3">Created At</th>
              <th class="px-4 py-3 text-center">Status</th>
              <th class="px-4 py-3 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          
          <tbody>
            <tr 
              v-for="app in filteredApplications" 
              :key="app.id" 
              class="border-b border-slate-800 hover:bg-slate-800/30 transition"
            >
              <!-- Call -->
              <td class="px-4 py-3">
                <div class="font-semibold text-white text-sm font-mono">
                  #{{ app.id }}
                </div>
                <div class="text-xs text-slate-500 font-mono mt-0.5">
                  Call: {{ app.call_id }}
                </div>
              </td>

              <!-- Applicant Type -->
              <td class="px-4 py-3">
                <span class="inline-flex items-center text-xs px-2 py-1 rounded border font-mono uppercase bg-slate-900 text-slate-400 border-slate-800">
                  {{ app.applicant_type === 'team' ? 'Team' : 'Individual' }}
                </span>
              </td>

              <!-- Program -->
              <td class="px-4 py-3">
                <span class="inline-flex items-center text-xs px-2 py-1 rounded border font-mono uppercase bg-blue-900/40 text-blue-400 border-blue-800">
                  PROG {{ app.program_type }}
                </span>
              </td>

              <!-- Created At -->
              <td class="px-4 py-3 text-xs text-slate-400 font-mono">
                {{ formatDate(app.created_at ?? '') }}
              </td>

              <!-- Status -->
              <td class="px-4 py-3 text-center whitespace-nowrap">
                <span 
                  class="text-xs px-2 py-1 rounded border font-mono uppercase whitespace-nowrap inline-block min-w-[110px]"
                  :class="statusConfig[app.status]?.class || 'bg-slate-900/40 text-slate-400 border-slate-800'"
                >
                  {{ statusConfig[app.status]?.text ?? app.status }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-2">
                  
                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="submitApp(app.id, app.status)"
                    :disabled="submittingId === app.id"
                    class="text-xs px-3 py-1 rounded border bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 border-blue-800 transition disabled:opacity-50 cursor-pointer"
                  >
                    <span v-if="submittingId === app.id">...</span>
                    <span v-else-if="app.status === 'pending_revision'">Apply Changes</span>
                    <span v-else>Submit</span>
                  </button>

                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="editApplication(app.id)"
                    :disabled="submittingId === app.id"
                    class="text-xs px-3 py-1 rounded border bg-slate-800 hover:bg-slate-700 text-white border-slate-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    Edit
                  </button>

                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="deleteApp(app.id)"
                    :disabled="submittingId === app.id"
                    class="text-xs px-3 py-1 rounded border bg-red-900/40 hover:bg-red-900/60 text-red-400 border-red-800 transition disabled:opacity-50 cursor-pointer"
                  >
                    Delete
                  </button>

                  <button 
                    @click="viewDetails(app.id)"
                    :disabled="submittingId === app.id"
                    class="text-xs px-3 py-1 rounded border bg-blue-600 hover:bg-blue-500 text-white border-blue-500 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-900/20"
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