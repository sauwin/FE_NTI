<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getApplications } from '@/features/applications/api/applications'
import { getEvaluations } from '@/features/evaluation/api/evaluations'

const router = useRouter()
const applications = ref<any[]>([])
const myEvaluations = ref<any[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const [appsRes, evalsRes] = await Promise.all([
      getApplications(),
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
  <div>
    <section class="section-divider-md">
      <div class="section-label">Applications to Evaluate</div>
      <p v-if="error" class="text-red-400 text-sm mb-4">{{ error }}</p>
      <div v-if="loading" class="text-slate-500 animate-pulse">Loading...</div>
      <div v-else-if="applications.length === 0" class="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
        <p class="text-slate-500 text-sm">No applications assigned for evaluation.</p>
      </div>
      <div v-else class="flex flex-col gap-3">
        <div
            v-for="app in applications" :key="app.id"
            class="border border-slate-800 rounded-xl px-6 py-4 bg-slate-900/30 flex items-center justify-between">
          <div>
            <span class="text-white text-sm font-medium">Program {{ app.program_type?.toUpperCase() }}</span>
            <span class="text-slate-600 text-xs ml-3">#{{ app.id }}</span>
            <p class="text-slate-500 text-xs mt-1">{{ app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Not submitted' }}</p>
          </div>
          <div class="flex items-center gap-3">
<span v-if="hasEvaluated(app.id)" class="text-xs px-2.5 py-0.5 rounded-full border bg-green-900/30 border-green-800 text-green-400">
Evaluated
</span>
            <button
                @click="router.push(`/evaluations/application/${app.id}`)"
                class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition">
              {{ hasEvaluated(app.id) ? 'Update' : 'Evaluate' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>