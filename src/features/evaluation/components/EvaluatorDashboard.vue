<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getEvaluatorApplications, getMyEvaluations } from '@/features/evaluation/api/evaluations'

const router = useRouter()
const applications = ref<any[]>([])
const myEvaluations = ref<any[]>([])
const loading = ref(true)
const error = ref('')

const filterProgram = ref<'all' | 'a' | 'b'>('all')
const filterStatus = ref<'all' | 'pending' | 'completed'>('all')

onMounted(async () => {
  try {
    const [appsRes, evalsRes] = await Promise.all([
      getEvaluatorApplications(), 
      getMyEvaluations(),
    ])
    applications.value = appsRes.data?.data ?? appsRes.data ?? []
    myEvaluations.value = evalsRes.data?.data ?? evalsRes.data ?? []
  } catch (err) {
    error.value = 'Chyba pri načítaní údajov pre komisiu.'
  } finally {
    loading.value = false
  }
})

function hasEvaluated(appId: number) {
  return myEvaluations.value.some((e: any) => e.application_id === appId)
}

const stats = computed(() => {
  const total = applications.value.length
  const completed = applications.value.filter(app => hasEvaluated(app.id)).length
  const pending = total - completed
  return { total, completed, pending }
})

const filteredApplications = computed(() => {
  return applications.value.filter(app => {
    const matchProg = filterProgram.value === 'all' || app.program_type?.toLowerCase() === filterProgram.value
    const evaluated = hasEvaluated(app.id)
    const matchStatus = filterStatus.value === 'all' || 
                        (filterStatus.value === 'completed' && evaluated) || 
                        (filterStatus.value === 'pending' && !evaluated)
    return matchProg && matchStatus
  })
})
</script>

<template>
  <div class="p-6 bg-slate-950 min-h-screen text-slate-100">
    <div class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-white">Portál hodnotiteľa NTI</h2>
        <p class="text-sm text-slate-400 mt-1">Prehľad a posudzovanie pridelených projektov v aktuálnom kvartálnom kole.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Celkom na hodnotenie</div>
        <div class="text-3xl font-bold mt-2 text-white">{{ stats.total }}</div>
      </div>
      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <div class="text-xs text-green-400 font-medium uppercase tracking-wider">Dokončené</div>
        <div class="text-3xl font-bold mt-2 text-green-400">{{ stats.completed }}</div>
      </div>
      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <div class="text-xs text-amber-400 font-medium uppercase tracking-wider font-semibold">Čaká na posúdenie</div>
        <div class="text-3xl font-bold mt-2 text-amber-400">{{ stats.pending }}</div>
      </div>
    </div>

    <div class="mb-6 flex flex-wrap gap-4 items-center justify-between border-b border-slate-800 pb-4">
      <div class="flex flex-wrap gap-3">
        <select 
          v-model="filterProgram" 
          class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none transition"
        >
          <option value="all">Všetky programy</option>
          <option value="a">Program A (Grantový)</option>
          <option value="b">Program B (Firemný)</option>
        </select>

        <select 
          v-model="filterStatus" 
          class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-blue-500 outline-none transition"
        >
          <option value="all">Všetky stavy</option>
          <option value="pending">Nevyhodnotené</option>
          <option value="completed">Vyhodnotené</option>
        </select>
      </div>
      <div class="text-xs text-slate-500">
        Zobrazené záznamy: {{ filteredApplications.length }}
      </div>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
      {{ error }}
    </div>

    <div>
      <div v-if="loading" class="text-slate-400 flex items-center justify-center p-12">
        <span class="animate-pulse">Načítavam priradené prihlášky...</span>
      </div>
      
      <div v-else-if="filteredApplications.length === 0" class="border border-slate-800 border-dashed rounded-2xl p-12 text-center bg-slate-900/10">
        <p class="text-slate-400 text-sm">Nenašli sa žiadne prihlášky vyhovujúce kritériám.</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-3">
        <div
          v-for="app in filteredApplications"
          :key="app.id"
          class="border border-slate-800 hover:border-slate-700 rounded-xl px-6 py-5 bg-slate-900/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <span 
                :class="[
                  app.program_type?.toLowerCase() === 'a' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  'text-xs font-semibold px-2.5 py-0.5 rounded-md border uppercase'
                ]"
              >
                Program {{ app.program_type }}
              </span>
              <span class="text-slate-500 text-xs font-mono">#{{ app.id }}</span>
            </div>
            
            <h3 class="text-white font-medium text-base pt-1">{{ app.project_name || 'Bez názvu projektu' }}</h3>
            
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-400">
              <p>Odoslané: <span class="text-slate-300">{{ app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('sk-SK') : '-' }}</span></p>
              <span class="text-slate-700 hidden sm:inline">•</span>
              <p>Tím: <span class="text-slate-300">{{ app.team_name || 'Nezadaný' }}</span></p>
            </div>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/60">
            <div>
              <span v-if="hasEvaluated(app.id)" class="text-xs px-3 py-1 rounded-full border bg-green-950/40 border-green-800 text-green-400 font-medium inline-flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                Ohodnotené
              </span>
              <span v-else class="text-xs px-3 py-1 rounded-full border bg-amber-950/40 border-amber-800 text-amber-400 font-medium inline-flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Čaká na vás
              </span>
            </div>
            
            <button
              @click="router.push(`/evaluations/application/${app.id}`)"
              :class="[
                hasEvaluated(app.id) ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-blue-600 hover:bg-blue-700 text-white',
                'text-xs font-medium px-4 py-2 rounded-xl transition shadow-sm font-semibold'
              ]"
            >
              {{ hasEvaluated(app.id) ? 'Aktualizovať' : 'Hodnotiť projekt' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>