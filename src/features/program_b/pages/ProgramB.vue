<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/features/auth/stores/auth'
import { getCompanyTasks } from '@/features/company/api/company'
import { getProgramBTasks } from '@/features/tasks/api/tasks'
import type { TaskWithCall } from '@/features/company/types/company'

import PageHero from '@/shared/ui/PageHero.vue'

const { t, locale } = useI18n()
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
  if (!dateString) return t('programB.view.noDeadline')
  
  // Use the active runtime language to match correct context parsing
  const currentLang = locale.value === 'sk' ? 'sk-SK' : 'en-US'
  return new Date(dateString).toLocaleDateString(currentLang, {
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
  <div class="bg-blue-950 absolute rounded-[100%] h-120 w-120 -z-10 -right-30 -top-10"></div>

  <div class="pb-20 mb-12">
    <PageHero
      :badge="t('programB.view.badge')"
      :title="t('programB.view.title')"
      :highlight="t('programB.view.highlight')"
    />

    <div v-if="auth.isCompany">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-white">{{ t('programB.view.technicalSpecifications') }}</h2>
        <button @click="goToCreateTask" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition">
          {{ t('programB.view.createNewTask') }}
        </button>
      </div>

      <div v-if="loading" class="text-gray-400">{{ t('programB.view.loadingChallenges') }}</div>
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
              {{ task.short_description || task.brief || t('programB.view.noDescriptionProvided') }}
            </p>
          </div>
          
          <div class="border-t border-slate-900 pt-4 mt-4">
            <div class="flex justify-between text-xs text-gray-500 mb-4">
              <span>Budget: {{ task.budget ? `€${task.budget}` : t('programB.view.budgetNotSpecified') }}</span>
              <span>{{ t('programB.view.applyDeadline', { date: formatDate(task.call?.deadline_at || task.deadline) }) }}</span>
            </div>
            <button 
              @click="goToTaskDetails(task.id)" 
              class="w-full bg-slate-900 hover:bg-slate-800 text-blue-400 py-2 rounded-lg text-sm font-medium transition border border-blue-900/40"
            >
              {{ t('programB.view.viewEditDetails') }}
            </button>
          </div>
        </div>
        <div v-if="!myTasks.length" class="text-gray-500 italic">{{ t('programB.view.noMyChallenges') }}</div>
      </div>
    </div>

    <div v-else class="mt-12">
      <h2 class="text-2xl font-bold text-white mb-6">{{ t('programB.view.availableTasks') }}</h2>
      
      <div v-if="loading" class="text-gray-400">{{ t('programB.view.loadingCatalog') }}</div>
      <div v-else class="grid gap-6 md:grid-cols-2">
        <div v-for="task in tasks" :key="task.id" class="border border-blue-800 bg-slate-950 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center font-bold text-xs text-white">
                  {{ task.organization?.name?.substring(0,2).toUpperCase() || 'CO' }}
                </div>
                <span class="text-sm text-gray-400 font-medium">{{ task.organization?.name || t('programB.view.unknownCompany') }}</span>
              </div>
              <span v-if="task.budget" class="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-900">
                €{{ task.budget }}
              </span>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">{{ task.title }}</h3>
            <p class="text-gray-400 text-sm mb-6 line-clamp-4">
              {{ task.short_description || task.brief || t('programB.view.noDescription') }}
            </p>
          </div>

          <div class="border-t border-slate-900 pt-4 mt-auto">
            <div class="flex justify-between text-xs text-gray-500 mb-4">
              <span>{{ t('programB.view.requiredTeam', { min: task.call?.min_team_size || 3, max: task.call?.max_team_size || '∞' }) }}</span>
              <span class="text-amber-400 font-medium">{{ t('programB.view.applyBefore', { date: formatDate(task.call?.deadline_at) }) }}</span>
            </div>
            
            <button 
              @click="goToTaskDetails(task.id)" 
              class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition"
            >
              {{ t('programB.view.viewDetailedSpecs') }}
            </button>
          </div>
        </div>
        <div v-if="!tasks.length" class="text-gray-500 italic">{{ t('programB.view.noTasks') }}</div>
      </div>
    </div>

  </div>
</template>