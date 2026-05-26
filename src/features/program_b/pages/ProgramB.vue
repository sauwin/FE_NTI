<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import { getCompanyTasks } from '@/features/company/api/company'
import { getProgramBTasks } from '@/features/tasks/api/tasks'
import type { TaskWithCall } from '@/features/company/types/company'

const router = useRouter()
const auth = useAuthStore()
const tasks = ref<TaskWithCall[]>([])
const myTasks = ref<TaskWithCall[]>([])
const loading = ref<boolean>(true)

onMounted(async () => {
  try {
    if (auth.isCompany) {
      const res = await getCompanyTasks()
      myTasks.value = res.data
    } else {
      const res = await getProgramBTasks()
      tasks.value = res.data
    }
  } catch (err) {
    console.error('Error fetching tasks catalog:', err)
  } finally {
    loading.value = false
  }
})

const goToCreateTask = (): void => {
  router.push('/programs/b/create-task')
}

const goToTaskDetails = (taskId: number): void => {
  router.push(`/programs/b/tasks/${taskId}`)
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'No deadline'
  return new Date(dateString).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const getStatusColor = (status: string) => {
  switch(status) {
    case 'draft': return 'bg-gray-800 text-gray-300 border-gray-600'
    case 'published': return 'bg-blue-950 text-blue-400 border-blue-800'
    case 'assigned': return 'bg-green-950 text-green-400 border-green-800'
    case 'in_matching': return 'bg-purple-950 text-purple-400 border-purple-800'
    default: return 'bg-slate-800 text-slate-300 border-slate-600'
  }
}
</script>

<template>
  <div class="px-20 py-10 relative overflow-hidden">
    <div class="bg-blue-950 absolute rounded-[100%] h-120 w-120 -z-10 -right-30 -top-10"></div>

    <div class="pb-20 mb-12">
      <div class="bg-blue-600 text-blue-100 text-xs font-bold text-center py-1 rounded-xl w-32 mb-5">PROGRAM B</div>
      <h1 class="font-bold text-5xl text-left leading-tight">
        Real-world<br> 
        <span class="text-blue-400">Industry Practice</span>
      </h1>

      <div v-if="auth.isCompany" class="mt-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-white">Our Technical Specifications</h2>
          <button @click="goToCreateTask" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
            + Create New Task
          </button>
        </div>

        <div v-if="loading" class="text-gray-400">Loading your challenges...</div>
        <div v-else class="grid gap-6 md:grid-cols-2">
          <div v-for="task in myTasks" :key="task.id" class="border border-blue-900 bg-slate-950 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold text-blue-300">{{ task.title }}</h3>
                <span :class="['text-xs px-2 py-0.5 rounded border uppercase font-semibold', getStatusColor(task.status)]">
                  {{ task.status }}
                </span>
              </div>
              <p class="text-gray-400 text-sm mb-4 line-clamp-3">
                {{ task.short_description || task.brief || 'No description provided.' }}
              </p>
            </div>
            
            <div class="border-t border-slate-900 pt-4 mt-4">
              <div class="flex justify-between text-xs text-gray-500 mb-4">
                <span>Budget: {{ task.budget ? `€${task.budget}` : 'Not specified' }}</span>
                <span>Apply Deadline: {{ formatDate(task.call?.deadline_at || task.deadline) }}</span>
              </div>
              <button 
                @click="goToTaskDetails(task.id)" 
                class="w-full bg-slate-900 hover:bg-slate-800 text-blue-400 py-2 rounded-lg text-sm font-medium transition border border-blue-900/40"
              >
                View & Edit Details
              </button>
            </div>
          </div>
          <div v-if="!myTasks.length" class="text-gray-500 italic">You haven't added any challenges yet.</div>
        </div>
      </div>

      <div v-else class="mt-12">
        <h2 class="text-2xl font-bold text-white mb-6">Available Industry Tasks</h2>
        
        <div v-if="loading" class="text-gray-400">Loading catalog...</div>
        <div v-else class="grid gap-6 md:grid-cols-2">
          <div v-for="task in tasks" :key="task.id" class="border border-blue-800 bg-slate-950 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center font-bold text-xs text-white">
                    {{ task.organization?.name?.substring(0,2).toUpperCase() || 'CO' }}
                  </div>
                  <span class="text-sm text-gray-400 font-medium">{{ task.organization?.name || 'Unknown Company' }}</span>
                </div>
                <span v-if="task.budget" class="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-900">
                  €{{ task.budget }}
                </span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">{{ task.title }}</h3>
              <p class="text-gray-400 text-sm mb-6 line-clamp-4">
                {{ task.short_description || task.brief || 'No description available.' }}
              </p>
            </div>

            <div class="border-t border-slate-900 pt-4 mt-auto">
              <div class="flex justify-between text-xs text-gray-500 mb-4">
                <span>Required Team: {{ task.call?.min_team_size || 3 }}-{{ task.call?.max_team_size || '∞' }} persons</span>
                <span class="text-amber-400 font-medium">Apply before: {{ formatDate(task.call?.deadline_at) }}</span>
              </div>
              
              <button 
                @click="goToTaskDetails(task.id)" 
                class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition"
              >
                View Detailed Specifications
              </button>
            </div>
          </div>
          <div v-if="!tasks.length" class="text-gray-500 italic">No available challenges at the moment.</div>
        </div>
      </div>

    </div>
  </div>
</template>