<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getEvaluatorApplications, getMyEvaluations } from '@/features/evaluation/api/evaluations'
import EvaluatorPendingTable from './EvaluatorPendingTable.vue'
import EvaluatorCompletedTable from './EvaluatorCompletedTable.vue'

const applications = ref<any[]>([])
const myEvaluations = ref<any[]>([])
const loading = ref(true)
const error = ref('')

const activeTab = ref<'overview' | 'pending' | 'completed'>('overview')
const filterProgram = ref<'all' | 'a' | 'b'>('all')

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

const pendingApplications = computed(() => {
  return applications.value.filter(app => !hasEvaluated(app.id) && (filterProgram.value === 'all' || app.program === filterProgram.value))
})

const completedApplications = computed(() => {
  return applications.value.filter(app => hasEvaluated(app.id) && (filterProgram.value === 'all' || app.program === filterProgram.value))
})
</script>

<template>
  <div class="space-y-8">
    <div v-if="error" class="p-4 border border-red-800/40 bg-red-950/20 text-red-400 rounded-xl text-sm">
      {{ error }}
    </div>

    <div v-if="loading && activeTab === 'overview'" class="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
      <div v-for="i in 3" :key="i" class="h-28 bg-slate-900/50 border border-slate-800 rounded-2xl"></div>
    </div>

    <div v-else class="space-y-6">
      <div class="flex flex-wrap gap-2 border-b border-slate-800/60 pb-4">
        <button @click="activeTab = 'overview'" :class="[activeTab === 'overview' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 border-transparent hover:text-slate-300', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Prehľad a Štatistiky
        </button>
        <button @click="activeTab = 'pending'" :class="[activeTab === 'pending' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 border-transparent hover:text-slate-300', 'px-4 py-2 text-sm font-medium transition rounded-xl border flex items-center gap-2']">
          Čaká na hodnotenie
          <span v-if="stats.pending > 0" class="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-xs font-bold">{{ stats.pending }}</span>
        </button>
        <button @click="activeTab = 'completed'" :class="[activeTab === 'completed' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 border-transparent hover:text-slate-300', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          História hodnotení
        </button>
      </div>

      <div v-if="activeTab !== 'overview'" class="flex items-center gap-3 bg-slate-900/20 border border-slate-800 p-4 rounded-xl">
        <span class="text-xs font-mono uppercase text-slate-500">Program:</span>
        <div class="flex gap-1.5">
          <button v-for="p in ['all', 'a', 'b'] as const" :key="p" @click="filterProgram = p" :class="['text-xs px-3 py-1.5 font-mono uppercase border rounded-lg transition', filterProgram === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700']">
            {{ p === 'all' ? 'Všetky' : `Program ${p}` }}
          </button>
        </div>
      </div>

      <div v-show="activeTab === 'overview'" class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div class="border border-slate-800 bg-slate-900/20 p-5 rounded-2xl">
          <div class="text-xs text-slate-500 uppercase font-mono tracking-wider mb-1">Celkovo priradené</div>
          <div class="text-3xl font-mono font-bold text-white">{{ stats.total }}</div>
        </div>
        <div class="border border-slate-800 bg-slate-900/20 p-5 rounded-2xl">
          <div class="text-xs text-slate-500 uppercase font-mono tracking-wider mb-1">Čaká na hodnotenie</div>
          <div class="text-3xl font-mono font-bold text-amber-400">{{ stats.pending }}</div>
        </div>
        <div class="border border-slate-800 bg-slate-900/20 p-5 rounded-2xl">
          <div class="text-xs text-slate-500 uppercase font-mono tracking-wider mb-1">Ohodnotené</div>
          <div class="text-3xl font-mono font-bold text-green-400">{{ stats.completed }}</div>
        </div>
      </div>

      <div v-show="activeTab === 'pending'">
        <EvaluatorPendingTable :applications="pendingApplications" :loading="loading" />
      </div>

      <div v-show="activeTab === 'completed'">
        <EvaluatorCompletedTable :applications="completedApplications" :loading="loading" />
      </div>
    </div>
  </div>
</template>