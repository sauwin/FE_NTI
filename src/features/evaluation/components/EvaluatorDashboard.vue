<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getEvaluations } from '@/features/evaluation/api/evaluations'
import { getAdminApplications } from '@/features/admin/api/admin'
import AdminLogs from '@/features/admin/components/AdminLogs.vue'

const router = useRouter()
const applications = ref<any[]>([])
const myEvaluations = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const activeTab = ref('applications')

onMounted(async () => {
  try {
    const [appsRes, evalsRes] = await Promise.all([
      getAdminApplications({ per_page: 100 }),
      getEvaluations(),
    ])
    applications.value = appsRes.data?.data ?? appsRes.data ?? []
    myEvaluations.value = evalsRes.data?.data ?? evalsRes.data ?? []
  } catch {
    error.value = 'Could not load data'
  } finally {
    loading.value = false
  }
})

function hasEvaluated(appId: number) {
  return myEvaluations.value.some((e: any) => e.application_id === appId)
}
</script>

<template>
  <div class="p-6 bg-slate-950 min-h-screen text-slate-100">
    <div class="mb-8">
      <div class="mb-5">
        <h2 class="text-3xl font-bold text-white">Evaluator Dashboard</h2>
        <p class="text-sm text-slate-500 mt-2">Review assigned applications and audit logs.</p>
      </div>

      <div class="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
            @click="activeTab = 'applications'"
            :class="[
            activeTab === 'applications'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Applications
        </button>

        <button
            @click="activeTab = 'logs'"
            :class="[
            activeTab === 'logs'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Audit Logs
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
      {{ error }}
    </div>

    <div v-show="activeTab === 'applications'">
      <div v-if="loading" class="text-slate-500 animate-pulse">Loading...</div>
      <div v-else-if="applications.length === 0" class="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
        <p class="text-slate-500 text-sm">No applications available for evaluation.</p>
      </div>
      <div v-else class="flex flex-col gap-3">
        <div
            v-for="app in applications"
            :key="app.id"
            class="border border-slate-800 rounded-xl px-6 py-4 bg-slate-900/30 flex items-center justify-between"
        >
          <div>
            <span class="text-white text-sm font-medium">Program {{ app.program_type?.toUpperCase() }}</span>
            <span class="text-slate-600 text-xs ml-3">#{{ app.id }}</span>
            <p class="text-slate-500 text-xs mt-1">{{ app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Not submitted' }}</p>
            <p v-if="app.status" class="text-slate-400 text-xs mt-0.5 capitalize">{{ app.status.replace(/_/g, ' ') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="hasEvaluated(app.id)" class="text-xs px-2.5 py-0.5 rounded-full border bg-green-900/30 border-green-800 text-green-400">
              Evaluated
            </span>
            <button
                @click="router.push(`/evaluations/application/${app.id}`)"
                class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition"
            >
              {{ hasEvaluated(app.id) ? 'Update' : 'Evaluate' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'logs'">
      <AdminLogs :users="[]" />
    </div>
  </div>
</template>