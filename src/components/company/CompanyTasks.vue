<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api/axios'

interface Program {
  id: number
  code: string
}

interface Call {
  id: number
  program?: Program | null
}

type TaskStatus =
  | 'draft'
  | 'published'
  | 'in_matching'
  | 'assigned'
  | 'in_progress'
  | 'closed'

interface CompanyTask {
  id: number
  title: string
  brief: string
  budget?: string | number | null
  status: TaskStatus
  created_at: string

  call?: Call | null
}

const tasks = ref<CompanyTask[]>([])
const loading = ref(false)

onMounted(async () => {
  await fetchTasks()
})

async function fetchTasks() {
  loading.value = true

  try {
    const response = await api.get<CompanyTask[]>('/company/tasks')

    tasks.value = Array.isArray(response.data)
      ? response.data
      : []
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

function getStatusColor(status: TaskStatus) {
  const colors: Record<TaskStatus, string> = {
    draft: 'bg-slate-600/30 text-slate-300',
    published: 'bg-blue-600/30 text-blue-300',
    in_matching: 'bg-yellow-600/30 text-yellow-300',
    assigned: 'bg-purple-600/30 text-purple-300',
    in_progress: 'bg-cyan-600/30 text-cyan-300',
    closed: 'bg-gray-600/30 text-gray-300',
  }

  return colors[status]
}
</script>

<template>
  <div class="space-y-8">

    <div v-if="loading" class="text-center py-8 text-slate-400">
      Loading tasks...
    </div>

    <div v-else-if="tasks.length === 0" class="text-center py-8 text-slate-500">
      No tasks yet. Create your first project task!
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition"
      >
        <div class="flex justify-between items-start mb-3">
          <div>
            <h4 class="text-lg font-semibold text-white">{{ task.title }}</h4>
            <p class="text-sm text-slate-400 mt-1">
              {{ task.brief.substring(0, 100) }}{{ task.brief.length > 100 ? '...' : '' }}
            </p>
          </div>
          <span :class="['text-xs px-3 py-1 rounded', getStatusColor(task.status)]">
            {{ task.status }}
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800">
          <div v-if="task.budget" class="text-sm">
            <span class="text-slate-400">Budget</span>
            <p class="text-white font-medium">${{ task.budget ? Number(task.budget).toLocaleString() : '-' }}</p>
          </div>
          <div class="text-sm">
            <span class="text-slate-400">Program</span>
            <p class="text-white font-medium capitalize">{{ task.call?.program?.code }}</p>
          </div>
          <div class="text-sm">
            <span class="text-slate-400">Created</span>
            <p class="text-white font-medium">{{ new Date(task.created_at).toLocaleDateString() }}</p>
          </div>
          <div class="text-sm text-right">
            <router-link
              :to="`/company/tasks/${task.id}/edit`"
              class="text-blue-400 hover:text-blue-300 transition"
            >
              Edit →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <router-link
      to="/programs/b/create-task"
      class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
    >
      Submit New Task
    </router-link>
  </div>
</template>