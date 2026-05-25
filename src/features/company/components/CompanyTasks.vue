<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCompanyTasks } from '@/features/company/api/company'
import type { CompanyTask, TaskStatus } from '@/features/company/types/company'

const router = useRouter()
const tasks = ref<CompanyTask[]>([])
const loading = ref(false)

onMounted(async () => {
  await fetchTasks()
})

async function fetchTasks() {
  loading.value = true
  try {
    const response = await getCompanyTasks()
    tasks.value = Array.isArray(response.data) ? response.data : []
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

function getStatusColor(status: TaskStatus) {
  const colors: Record<TaskStatus, string> = {
    draft: 'bg-slate-800 text-slate-300 border-slate-700',
    published: 'bg-blue-950 text-blue-400 border-blue-900',
    in_matching: 'bg-amber-950 text-amber-400 border-amber-900',
    assigned: 'bg-purple-950 text-purple-400 border-purple-900',
    in_progress: 'bg-cyan-950 text-cyan-400 border-cyan-900',
    closed: 'bg-gray-800 text-gray-400 border-gray-700',
  }
  return colors[status]
}

const viewDetails = (taskId: number) => {
  router.push(`/programs/b/tasks/${taskId}`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center border-b border-slate-900 pb-4">
      <div>
        <h3 class="text-xl font-bold text-white">Our technical specifications</h3>
        <p class="text-xs text-slate-500 mt-0.5">Requirements and Project Backlog Management in Program B</p>
      </div>
      <router-link
        to="/programs/b/create-task"
        class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-900/20"
      >
        + Create a task
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-400 text-sm">
      <span class="inline-block animate-pulse">Download company specifications...</span>
    </div>

    <div v-else-if="tasks.length === 0" class="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
      <p class="text-sm text-slate-500">You haven't added any assignments for students yet.</p>
      <router-link to="/programs/b/create-task" class="text-blue-400 hover:underline text-xs mt-2 inline-block">
        Post the first assignment now →
      </router-link>
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="task in tasks"
        :key="task.id"
        @click="viewDetails(task.id)"
        class="bg-slate-900/40 border border-slate-900 rounded-xl p-5 hover:border-blue-900/40 transition cursor-pointer group relative"
      >
        <div class="flex justify-between items-start gap-4 mb-3">
          <div class="space-y-1">
            <h4 class="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
              {{ task.title }}
            </h4>
            <p class="text-xs text-slate-400 line-clamp-2 max-w-2xl leading-relaxed">
              {{ task.short_description || task.brief || 'Опис відсутній.' }}
            </p>
          </div>
          <span :class="['text-[10px] px-2.5 py-0.5 rounded border uppercase font-semibold tracking-wider shrink-0', getStatusColor(task.status)]">
            {{ task.status }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-950 text-xs">
          <div>
            <span class="text-slate-500 block mb-0.5">Budget</span>
            <p class="text-slate-300 font-medium">
              {{ task.budget ? `€${Number(task.budget).toLocaleString()}` : 'Not specified' }}
            </p>
          </div>
          <div>
            <span class="text-slate-500 block mb-0.5">Program</span>
            <p class="text-slate-300 font-medium uppercase tracking-wider">
              {{ task.call?.program?.code ? task.call.program.code.replace('program_', 'Program ') : 'B' }}
            </p>
          </div>
          <div>
            <span class="text-slate-500 block mb-0.5">Created</span>
            <p class="text-slate-300 font-medium">
              {{ new Date(task.created_at).toLocaleDateString('uk-UA') }}
            </p>
          </div>
          
          <div class="text-right flex items-center justify-end gap-4 text-xs" @click.stop>
            <router-link
              :to="`/company/tasks/${task.id}/edit`"
              class="text-slate-500 hover:text-white transition font-medium"
            >
              Edit
            </router-link>
            <button
              @click="viewDetails(task.id)"
              class="text-blue-400 hover:text-blue-300 font-bold transition"
            >
              TS →
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>