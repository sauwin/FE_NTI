<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import { getTaskById } from '@/features/tasks/api/tasks'
import { downloadDocument as downloadDocumentFile } from '@/shared/api/documents'
import type { AttachedDocument, TaskDetails } from '@/features/tasks/types/tasks'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const task = ref<TaskDetails | null>(null)
const loading = ref<boolean>(true)
const error = ref<string>('')
const downloadLoadingId = ref<number | null>(null) // Для індикації завантаження конкретного файлу

onMounted(async () => {
  const taskId = route.params.id
  try {
    const res = await getTaskById(taskId)
    task.value = res.data
  } catch (err) {
    console.error(err)
    error.value = 'The task specification could not be loaded, or it does not exist.'
  } finally {
    loading.value = false
  }
})

const downloadDocument = async (doc: AttachedDocument) => {
  downloadLoadingId.value = doc.id
  try {
    const response = await downloadDocumentFile(doc.id)
    
    const blob = new Blob([response.data])
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    // Використовуємо реальне поле з бази даних
    link.download = doc.file_name || `document-${doc.id}.pdf`
    link.click()
    
    window.URL.revokeObjectURL(link.href)
  } catch (err) {
    console.error('Помилка при завантаженні файлу:', err)
  } finally {
    downloadLoadingId.value = null
  }
}

const handleApply = () => {
  if (!task.value?.call_id) {
    alert('Error: No call was found for this task.')
    return
  }
  router.push(`/programs/b/apply/${task.value.call_id}`)
}

const goBack = () => {
  router.back()
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Not specified'
  return new Date(dateString).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="px-6 md:px-20 py-10 text-gray-300 min-h-screen bg-slate-950 relative overflow-hidden">
    <div class="bg-blue-950 absolute rounded-[100%] h-120 w-120 -z-10 -right-30 -top-10 opacity-40"></div>

    <button @click="goBack" class="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-8 group">
      <span class="group-hover:-translate-x-1 transition-transform">←</span> Back to catalog
    </button>

    <div v-if="loading" class="text-center py-20 text-gray-400">
      Technical specification is downloading...
    </div>

    <div v-else-if="error" class="text-center py-20 text-red-400 font-medium">
      {{ error }}
    </div>

    <div v-else-if="task" class="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
      
      <div class="lg:col-span-2 space-y-8">
        <div>
          <div class="flex items-center gap-3 mb-3">
            <span class="bg-blue-600/10 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded border border-blue-900/60 uppercase">
              Program B Task
            </span>
            <span class="text-gray-500 text-xs">ID: {{ task.id }}</span>
          </div>
          <h1 class="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
            {{ task.title }}
          </h1>
          <p class="text-gray-400 italic text-base leading-relaxed border-l-2 border-blue-600 pl-4 py-1">
            {{ task.short_description || task.brief }}
          </p>
        </div>

        <div v-if="task.project_goal" class="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl">
          <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-sm"></span> Project Goal
          </h2>
          <p class="text-gray-400 text-sm whitespace-pre-line leading-relaxed">{{ task.project_goal }}</p>
        </div>

        <div v-if="task.expected_outcome" class="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl">
          <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-sm"></span> Expected Outcome
          </h2>
          <p class="text-gray-400 text-sm whitespace-pre-line leading-relaxed">{{ task.expected_outcome }}</p>
        </div>

        <div v-if="task.detailed_technical_description" class="space-y-3">
          <h2 class="text-xl font-bold text-white">Detailed technical description</h2>
          <div class="text-gray-400 text-sm whitespace-pre-line bg-slate-950 border border-slate-900 p-6 rounded-2xl leading-relaxed">
            {{ task.detailed_technical_description }}
          </div>
        </div>

        <div class="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl space-y-4">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <span class="w-1.5 h-4 bg-blue-500 rounded-sm"></span> Attached Specifications & Materials
          </h2>
          
          <div v-if="task.documents && task.documents.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div 
              v-for="doc in task.documents" 
              :key="doc.id" 
              class="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl hover:border-blue-900/60 transition group"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 bg-red-950/40 border border-red-900/30 rounded-lg flex items-center justify-center shrink-0 text-red-400 font-bold text-xs uppercase">
                  pdf
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-200 truncate pr-2" :title="doc.file_name">
                    {{ doc.file_name }}
                  </p>
                  <span class="text-[10px] text-gray-500 uppercase tracking-wider block">Attached file</span>
                </div>
              </div>

              <button 
                @click="downloadDocument(doc)"
                :disabled="downloadLoadingId === doc.id"
                class="bg-blue-950/40 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 border border-blue-900/40 hover:border-blue-600 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0"
              >
                {{ downloadLoadingId === doc.id ? 'Loading...' : 'Download' }}
              </button>
            </div>
          </div>

          <div v-else class="text-sm text-slate-500 italic p-2">
            The organization has not attached any external technical documents to this template.
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-if="task.architecture_requirements" class="border border-slate-900 p-5 rounded-xl bg-slate-900/20">
            <h3 class="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">Architectural requirements</h3>
            <p class="text-gray-400 text-sm whitespace-pre-line">{{ task.architecture_requirements }}</p>
          </div>
          <div v-if="task.integrations_apis" class="border border-slate-900 p-5 rounded-xl bg-slate-900/20">
            <h3 class="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">APIs and Integrations</h3>
            <p class="text-gray-400 text-sm whitespace-pre-line">{{ task.integrations_apis }}</p>
          </div>
        </div>

        <div v-if="task.milestones" class="space-y-3">
          <h2 class="text-lg font-bold text-white">Key stages and milestones</h2>
          <div class="text-gray-400 text-sm whitespace-pre-line bg-slate-900/20 border border-slate-900 p-6 rounded-2xl">
            {{ task.milestones }}
          </div>
        </div>
      </div>

      <div class="space-y-6">
        
        <div class="border border-blue-900/40 bg-slate-950 p-6 rounded-2xl">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Project Owner</h3>
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center text-lg shadow-lg">
              {{ task.organization?.name?.substring(0, 2).toUpperCase() || 'CO' }}
            </div>
            <div>
              <h4 class="font-bold text-white text-lg leading-tight">
                {{ task.organization?.name || 'Company Name' }}
              </h4>
              <span class="text-xs text-gray-500">Registered NTI Partner</span>
            </div>
          </div>
        </div>

        <div class="border border-slate-900 bg-slate-900/30 p-6 rounded-2xl space-y-4">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-slate-900 pb-2">
            Requirements and Restrictions
          </h3>

          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500">Budget:</span>
            <span class="font-bold text-green-400 text-base">
              {{ task.budget ? `€${task.budget}` : 'Not specified' }}
            </span>
          </div>

          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500">Target team:</span>
            <span class="text-white font-medium">
              {{ task.call?.min_team_size || 3 }}-{{ task.call?.max_team_size || '∞' }} people
            </span>
          </div>

          <div v-if="task.platforms" class="flex justify-between items-start text-sm">
            <span class="text-gray-500 shrink-0">Platforms:</span>
            <span class="text-white font-medium text-right">{{ task.platforms }}</span>
          </div>

          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500">Expected duration:</span>
            <span class="text-white font-medium">{{ task.expected_duration || '1 semester' }}</span>
          </div>

          <div class="flex justify-between items-center text-sm border-t border-slate-900 pt-4">
            <span class="text-amber-400 font-medium">Submission deadline:</span>
            <span class="text-amber-400 font-bold">
              {{ formatDate(task.call?.deadline_at || task.deadline) }}
            </span>
          </div>
        </div>

        <div v-if="task.required_technologies?.length || task.required_skills?.length" class="border border-slate-900 bg-slate-900/10 p-6 rounded-2xl space-y-5">
          <div v-if="task.required_technologies?.length">
            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Technology stack</h4>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="tech in task.required_technologies" :key="tech" class="bg-blue-950/60 text-blue-400 text-xs px-2.5 py-1 rounded border border-blue-900/40">
                {{ tech }}
              </span>
            </div>
          </div>

          <div v-if="task.required_skills?.length">
            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Required skills</h4>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="skill in task.required_skills" :key="skill" class="bg-slate-900 text-slate-300 text-xs px-2.5 py-1 rounded border border-slate-800">
                {{ skill }}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-4">
          <button 
            v-if="!auth.isCompany"
            @click="handleApply" 
            class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 cursor-pointer text-center text-sm"
          >
            Apply with team
          </button>
          
          <div v-else class="text-center p-3 bg-slate-900 rounded-xl border border-blue-900/20">
            <span class="text-xs text-gray-500 block mb-1">Status of your specification</span>
            <span class="text-sm font-bold uppercase tracking-wider text-blue-400">{{ task.status }}</span>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>