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
      // Якщо звичайна чернетка draft — викликаємо стандартну функцію
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
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="text-white font-bold text-xl tracking-tight">Moje prihlášky (My Applications)</h3>
        <p class="text-xs text-slate-500 mt-1">Prehľad a sledovanie stavu vašich odoslaných projektov a prihlášok.</p>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl">
      <div class="flex flex-wrap gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">Program</label>
          <select 
            v-model="filterProgram" 
            class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 min-w-[160px] transition"
          >
            <option value="all">Všetky programy</option>
            <option value="a">Program A</option>
            <option value="b">Program B</option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">Stav (Status)</label>
          <select 
            v-model="filterStatus" 
            class="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 min-w-[180px] transition"
          >
            <option value="all">Všetky stavy</option>
            <option v-for="(cfg, key) in statusConfig" :key="key" :value="key">
              {{ cfg.text }}
            </option>
          </select>
        </div>
      </div>

      <button 
        @click="fetchApplications" 
        class="text-slate-400 text-xs font-medium hover:text-white border border-slate-800 bg-slate-950 px-4 py-2 rounded-xl transition flex items-center justify-center gap-2 h-[34px] cursor-pointer"
      >
        Refresh
      </button>
    </div>

    <div v-if="loading" class="border border-slate-800 rounded-2xl p-12 bg-slate-900/20 text-center text-slate-400 text-sm animate-pulse font-mono">
      Načítavam prihlášky...
    </div>

    <div v-else>
      <div v-if="error" class="text-xs font-mono text-red-400 bg-red-950/20 border border-red-900/40 p-4 rounded-xl mb-4">
        System Error: {{ error }}
      </div>

      <div v-if="filteredApplications.length === 0" class="border border-slate-800 border-dashed rounded-2xl p-12 text-center bg-slate-900/10">
        <p class="text-slate-400 text-base font-medium">Nenašli sa žiadne prihlášky.</p>
        <p class="text-slate-600 text-xs mt-1.5">Zatiaľ ste si nevytvorili koncept ani nepodali žiadnu oficiálnu prihlášku.</p>
      </div>

      <div v-else class="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950/40">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-800 bg-slate-900/60 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              <th class="py-3 px-6">ID / Výzva</th>
              <th class="py-3 px-6">Typ žiadateľa</th>
              <th class="py-3 px-6">Program</th>
              <th class="py-3 px-6">Dátum vytvorenia</th>
              <th class="py-3 px-6 text-center">Status</th>
              <th class="py-3 px-6 text-right">Akcie</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/40 text-xs text-slate-300">
            <tr 
              v-for="app in filteredApplications" 
              :key="app.id" 
              class="hover:bg-slate-900/20 transition-colors"
            >
              <td class="py-4 px-6 font-medium text-white">
                <span class="font-mono text-sm">#{{ app.id }}</span>
                <span class="text-[11px] text-slate-500 block font-mono mt-0.5">Call: {{ app.call_id }}</span>
              </td>

              <td class="py-4 px-6 text-slate-300">
                <span class="inline-flex items-center gap-1.5 font-medium">
                  <span class="text-slate-500 text-[10px] font-mono uppercase">
                    {{ app.applicant_type === 'team' ? 'Team' : 'Individual' }}
                  </span>
                </span>
              </td>

              <td class="py-4 px-6">
                <span class="px-2 py-1 text-[10px] bg-slate-900 text-slate-400 border border-slate-800 rounded-lg font-mono uppercase tracking-wider">
                  Prog {{ app.program_type }}
                </span>
              </td>

              <td class="py-4 px-6 font-mono text-slate-400">
                {{ formatDate(app.created_at ?? '') }}
              </td>

              <td class="py-4 px-6 text-center">
                <span 
                  class="inline-block px-3 py-1 text-[11px] font-medium rounded-xl border text-center tracking-wide min-w-[110px]"
                  :class="statusConfig[app.status]?.class || 'bg-slate-800 text-slate-300 border-slate-700'"
                >
                  {{ statusConfig[app.status]?.text ?? app.status }}
                </span>
              </td>

              <td class="py-4 px-6 text-right">
                <div class="flex justify-end gap-2 items-center">
                  
                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="submitApp(app.id, app.status)"
                    :disabled="submittingId === app.id"
                    class="border border-blue-900/50 text-blue-400 hover:text-white hover:bg-blue-600/20 px-2.5 py-1.5 rounded-xl transition font-medium cursor-pointer disabled:opacity-50"
                  >
                    <span v-if="submittingId === app.id">...</span>
                    <span v-else-if="app.status === 'pending_revision'">Apply Changes</span>
                    <span v-else>Submit</span>
                  </button>

                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="editApplication(app.id)"
                    :disabled="submittingId === app.id"
                    class="border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 px-2.5 py-1.5 rounded-xl transition font-medium cursor-pointer disabled:opacity-50"
                  >
                    Edit
                  </button>

                  <button 
                    v-if="['draft', 'pending_revision'].includes(app.status)"
                    @click="deleteApp(app.id)"
                    :disabled="submittingId === app.id"
                    class="border border-transparent text-slate-500 hover:text-red-400 hover:bg-red-950/20 px-2.5 py-1.5 rounded-xl transition font-medium cursor-pointer disabled:opacity-50"
                  >
                    Delete
                  </button>

                  <button 
                    @click="viewDetails(app.id)"
                    :disabled="submittingId === app.id"
                    class="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
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