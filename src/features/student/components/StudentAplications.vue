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

const statusConfig: Record<string, { text: string; class: string }> = {
  draft: { text: 'Draft', class: 'bg-slate-800 text-slate-300 border-slate-700' },
  submitted: { text: 'Submitted', class: 'bg-blue-950 text-blue-400 border-blue-900/50' },
  formal_check: { text: 'Formal Check', class: 'bg-indigo-950 text-indigo-400 border-indigo-900/50' },
  formally_verified: { text: 'Verified', class: 'bg-purple-950 text-purple-400 border-purple-900/50' },
  under_evaluation: { text: 'In Evaluation', class: 'bg-amber-950/70 text-amber-400 border-amber-900/50' },
  pending_revision: { text: 'Needs Revision', class: 'bg-orange-950 text-orange-400 border-orange-900/50' },
  approved: { text: 'Approved', class: 'bg-emerald-950 text-emerald-400 border-emerald-900/50' },
  rejected: { text: 'Rejected', class: 'bg-red-950 text-red-400 border-red-900/50' },
  onboarding: { text: 'Onboarding', class: 'bg-cyan-950 text-cyan-400 border-cyan-900/50' },
  active: { text: 'Active', class: 'bg-green-950 text-green-400 border-green-900/50' },
  suspended: { text: 'Suspended', class: 'bg-yellow-950 text-yellow-500 border-yellow-900/50' },
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
  <div class="mt-6 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-white font-semibold text-xl tracking-tight">Moje prihlášky (My Applications)</h3>
        <p class="text-xs text-slate-500 mt-0.5">Prehľad a sledovanie stavu vašich odoslaných projektov a prihlášok.</p>
      </div>
      <button 
        @click="fetchApplications" 
        class="self-start sm:self-auto text-slate-400 text-sm hover:text-white border border-slate-800 bg-slate-900/50 px-4 py-2 rounded-xl transition flex items-center gap-2"
      >
        Refresh
      </button>
    </div>

    <div class="flex flex-wrap gap-3 bg-slate-900/30 p-4 border border-slate-800/80 rounded-xl">
      <div class="flex flex-col gap-1">
        <label class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Program</label>
        <select 
          v-model="filterProgram" 
          class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 min-w-35"
        >
          <option value="all">Všetky programy</option>
          <option value="a">Program A</option>
          <option value="b">Program B</option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Stav (Status)</label>
        <select 
          v-model="filterStatus" 
          class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 min-w-40"
        >
          <option value="all">Všetky stavy</option>
          <option v-for="(cfg, key) in statusConfig" :key="key" :value="key">
            {{ cfg.text }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="border border-slate-800 rounded-xl p-8 bg-slate-900/10 text-center text-slate-500 text-sm animate-pulse">
      Načítavam prihlášky…
    </div>

    <div v-else>
      <div v-if="error" class="text-sm text-red-400 bg-red-950/20 border border-red-900/40 p-4 rounded-xl mb-3">
        ⚠️ {{ error }}
      </div>

      <div v-if="filteredApplications.length === 0" class="border border-slate-800 border-dashed rounded-2xl p-12 text-center bg-slate-900/10">
        <p class="text-slate-400 text-base font-medium">Nenašli sa žiadne prihlášky.</p>
        <p class="text-slate-600 text-xs mt-1">Zatiaľ ste si nevytvorili koncept ani nepodali žiadnu oficiálnu prihlášku.</p>
      </div>

      <div v-else class="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/20">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800 bg-slate-900/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th class="py-3 px-4">ID / Výzva</th>
              <th class="py-3 px-4">Typ žiadateľa</th>
              <th class="py-3 px-4">Program</th>
              <th class="py-3 px-4">Dátum vytvorenia</th>
              <th class="py-3 px-4 text-center">Status</th>
              <th class="py-3 px-4 text-right">Akcie</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-sm text-slate-300">
            <tr 
              v-for="app in filteredApplications" 
              :key="app.id" 
              class="hover:bg-slate-900/30 transition-colors"
            >
              <td class="py-3.5 px-4 font-medium text-white">
                #{{ app.id }} 
                <span class="text-xs text-slate-500 block font-normal">Call ID: {{ app.call_id }}</span>
              </td>

              <td class="py-3.5 px-4">
                <span class="flex items-center gap-1.5">
                  <span v-if="app.applicant_type === 'team'">👥 Tímová</span>
                  <span v-else>👤 Jednotlivec</span>
                </span>
              </td>

              <td class="py-3.5 px-4">
                <span class="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded font-mono uppercase">
                  Prog {{ app.program_type }}
                </span>
              </td>

              <td class="py-3.5 px-4 text-xs text-slate-400">
                {{ formatDate(app.created_at ?? '') }}
              </td>

              <td class="py-3.5 px-4 text-center">
                <span 
                  class="inline-block px-2.5 py-1 text-xs font-medium rounded-full border text-center whitespace-nowrap"
                  :class="statusConfig[app.status]?.class || 'bg-slate-800 text-slate-300 border-slate-700'"
                >
                  {{ statusConfig[app.status]?.text ?? app.status }}
                </span>
              </td>

              <td class="py-3.5 pr-4 pl-0 text-right text-xs">
                <div class="flex justify-end gap-2 items-center">
                  
                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="submitApp(app.id)"
                    :disabled="submittingId === app.id"
                    class="border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    {{ submittingId === app.id ? '...' : '🚀 Submit' }}
                  </button>

                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="editApplication(app.id)"
                    :disabled="submittingId === app.id"
                    class="border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    ✏️ Edit
                  </button>

                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="deleteApp(app.id)"
                    :disabled="submittingId === app.id"
                    class="border border-slate-700 text-slate-300 hover:text-red-400 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    🗑 Delete
                  </button>

                  <button 
                    @click="viewDetails(app.id)"
                    :disabled="submittingId === app.id"
                    class="bg-blue-600 hover:bg-blue-500 text-white font-medium px-2.5 py-1.5 rounded-lg transition cursor-pointer"
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