<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getPrograms } from '@/shared/api/programs'
import { getCompanyTasks } from '@/features/company/api/company'
import { createCallWithTask, updateCallWithTask } from '@/features/tasks/api/tasks'
import type { Program } from '@/shared/types/programs'

const { t } = useI18n()

// Auxiliary function to transform text into snake_case on frontend
function toSnakeCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_ ]/g, '') // Remove special characters
    .replace(/\s+/g, '_')        // Replace spaces with underscores
    .replace(/_+/g, '_')         // Prevent double underscores
}

interface TaskDocumentRequirement {
  id: string
  document_name: string
  is_mandatory: boolean
  max_size_mb: number
  type?: string
}

const router = useRouter()
const route = useRoute()

const step = ref(1)
const loading = ref(false)
const error = ref('')

const taskId = computed(() => route.params.id as string | undefined)
const isEditMode = computed(() => !!taskId.value)

const programBId = ref<number | null>(null)

const taskForm = ref({
  title: '',
  short_description: '',
  project_goal: '',
  expected_outcome: '',
  detailed_technical_description: '',
  required_technologies: '',
  architecture_requirements: '',
  required_skills: '',
  budget: null as number | null,
  deadline: '',
})

const callForm = ref({
  opens_at: '',
  deadline_at: '',
  min_team_size: 3,
  max_team_size: null as number | null,
  required_documents: [
    { id: Date.now().toString(), document_name: 'Team Project Pitch', max_size_mb: 10 }
  ] as TaskDocumentRequirement[]
})

const files = ref<Record<string, File>>({})
const existingDocuments = ref<Array<{ type: string, file_name: string }>>([])

onMounted(async () => {
  loading.value = true
  try {
    const res = await getPrograms()
    const progs = res.data ?? []
    const progB = progs.find((p: Program) => p.code === 'program_b')
    if (progB) {
      programBId.value = progB.id
    }

    if (isEditMode.value && taskId.value) {
      const tasksRes = await getCompanyTasks()
      const allTasks = tasksRes.data?.data ?? tasksRes.data ?? []
      const currentTask = allTasks.find((t: any) => String(t.id) === String(taskId.value))

      if (currentTask) {
        taskForm.value = {
          title: currentTask.title || '',
          short_description: currentTask.short_description || '',
          project_goal: currentTask.project_goal || '',
          expected_outcome: currentTask.expected_outcome || '',
          detailed_technical_description: currentTask.detailed_technical_description || '',
          required_technologies: Array.isArray(currentTask.required_technologies) 
            ? currentTask.required_technologies.join(', ') 
            : currentTask.required_technologies || '',
          architecture_requirements: currentTask.architecture_requirements || '',
          required_skills: Array.isArray(currentTask.required_skills) 
            ? currentTask.required_skills.join(', ') 
            : currentTask.required_skills || '',
          budget: currentTask.budget ? Number(currentTask.budget) : null,
          deadline: currentTask.deadline ? currentTask.deadline.split('T')[0] : '',
        }

        if (currentTask.call) {
          callForm.value.opens_at = currentTask.call.start_date ? currentTask.call.start_date.split('T')[0] : ''
          callForm.value.deadline_at = currentTask.call.end_date ? currentTask.call.end_date.split('T')[0] : ''
          
          if (currentTask.call.required_documents) {
            const reqDocs = typeof currentTask.call.required_documents === 'string'
              ? JSON.parse(currentTask.call.required_documents)
              : currentTask.call.required_documents
            
            if (Array.isArray(reqDocs)) {
              callForm.value.required_documents = reqDocs.map((doc: any, idx: number) => {
                // Handle both old string format and new object format
                if (typeof doc === 'string') {
                  const humanName = doc
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')

                  return {
                    id: doc, 
                    document_name: humanName,
                    is_mandatory: true,
                    max_size_mb: 10,
                    type: doc
                  }
                } else {
                  // Already an object with document_name, is_mandatory, max_size_mb, optionally type
                  return {
                    id: `doc-${idx}-${Date.now()}`,
                    document_name: doc.document_name || '',
                    is_mandatory: doc.is_mandatory ?? true,
                    max_size_mb: doc.max_size_mb || 10,
                    type: doc.type || toSnakeCase(doc.document_name || ''),
                  }
                }
              })
            }
          }
        }

        if (currentTask.documents && Array.isArray(currentTask.documents)) {
          existingDocuments.value = currentTask.documents.map((d: any) => ({
            type: d.type,
            file_name: d.file_name
          }))
        }
      } else {
        error.value = t('tasks.form.errorNotFound')
      }
    }
  } catch (err: any) {
    error.value = t('tasks.form.errorInit')
    console.error(err)
  } finally {
    loading.value = false
  }
})

function handleFileChange(key: string, event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    files.value[key] = target.files[0]
  }
}

function addDocumentRequirement() {
  callForm.value.required_documents.push({
    id: Date.now().toString(),
    document_name: '',
    is_mandatory: true,
    max_size_mb: 10
  })
}

function removeDocumentRequirement(id: string) {
  callForm.value.required_documents = callForm.value.required_documents.filter(d => d.id !== id)
  delete files.value[id]
}

function getExistingFileName(typeKey: string): string | null {
  const doc = existingDocuments.value.find(d => d.type === typeKey)
  return doc ? doc.file_name : null
}

async function submitChallenge(frontendStatus: 'draft' | 'published') {
  error.value = ''
  loading.value = true

  const fd = new FormData()
  fd.append('status', frontendStatus)

  const techArray = taskForm.value.required_technologies.split(',').map(s => s.trim()).filter(Boolean)
  const skillsArray = taskForm.value.required_skills.split(',').map(s => s.trim()).filter(Boolean)

  fd.append('title', taskForm.value.title)
  fd.append('short_description', taskForm.value.short_description)
  fd.append('project_goal', taskForm.value.project_goal)
  fd.append('expected_outcome', taskForm.value.expected_outcome)
  fd.append('detailed_technical_description', taskForm.value.detailed_technical_description)
  fd.append('architecture_requirements', taskForm.value.architecture_requirements)
  fd.append('budget', taskForm.value.budget ? String(taskForm.value.budget) : '')
  fd.append('deadline', taskForm.value.deadline)

  techArray.forEach((tech, index) => {
    fd.append(`required_technologies[${index}]`, tech)
  })
  skillsArray.forEach((skill, index) => {
    fd.append(`required_skills[${index}]`, skill)
  })

  const snakeCaseDocs: any[] = []
  
  callForm.value.required_documents.forEach(d => {
    if (d.document_name.trim().length > 0) {
      const snakeKey = d.type ?? toSnakeCase(d.document_name)
      
      // Store the full object structure, including type when present
      snakeCaseDocs.push({
        document_name: d.document_name,
        is_mandatory: d.is_mandatory,
        max_size_mb: d.max_size_mb,
        type: snakeKey,
      })

      const filePayload = files.value[d.id] || files.value[snakeKey]
      if (filePayload) {
        fd.append(`files[${snakeKey}]`, filePayload)
      }
    }
  })
  
  fd.append('required_documents', JSON.stringify(snakeCaseDocs))

  try {
    if (isEditMode.value && taskId.value) {
      fd.append('_method', 'PUT')
      await updateCallWithTask(taskId.value, fd)
    } else {
      await createCallWithTask(fd)
    }
    
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.response?.data?.message || t('tasks.form.errorSave')
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-10 px-4 text-white">
    <div class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight">
        {{ isEditMode ? t('tasks.form.titleEdit') : t('tasks.form.titleCreate') }}
      </h1>
      <p class="text-sm text-gray-400 mt-1">
        {{ isEditMode ? t('tasks.form.subtitleEdit') : t('tasks.form.subtitleCreate') }}
      </p>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-red-900/20 border border-red-500/40 text-red-400 rounded-xl text-sm">
      {{ error }}
    </div>

    <div class="grid grid-cols-5 gap-2 mb-10 text-center text-xs font-mono">
      <div v-for="i in 5" :key="i" class="h-1 rounded transition-colors" :class="step >= i ? 'bg-blue-500' : 'bg-gray-800'"></div>
    </div>

    <form @submit.prevent class="space-y-8 bg-slate-900/40 border border-slate-800 p-8 rounded-2xl">
      
      <!-- STEP 1 -->
      <div v-if="step === 1" class="space-y-6">
        <h2 class="text-lg font-semibold border-b border-gray-800 pb-3 font-mono text-blue-400">
          {{ t('tasks.form.steps.metadata') }}
        </h2>
        
        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">{{ t('tasks.form.labels.title') }}</label>
          <input v-model="taskForm.title" type="text" :placeholder="t('tasks.form.placeholders.title')" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
        </div>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">{{ t('tasks.form.labels.shortDescription') }}</label>
          <textarea v-model="taskForm.short_description" rows="3" :placeholder="t('tasks.form.placeholders.shortDescription')" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors resize-none"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">{{ t('tasks.form.labels.budget') }}</label>
            <input v-model="taskForm.budget" type="number" :placeholder="t('tasks.form.placeholders.budget')" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">{{ t('tasks.form.labels.deadline') }}</label>
            <input v-model="taskForm.deadline" type="date" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
          </div>
        </div>

        <div class="flex justify-end pt-4">
          <button type="button" @click="step = 2" :disabled="!taskForm.title || !taskForm.short_description" class="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 h-11 rounded-md transition-colors disabled:opacity-50 cursor-pointer" v-html="t('tasks.form.continue')"></button>
        </div>
      </div>

      <!-- STEP 2 -->
      <div v-if="step === 2" class="space-y-6">
        <h2 class="text-lg font-semibold border-b border-gray-800 pb-3 font-mono text-blue-400">
          {{ t('tasks.form.steps.goals') }}
        </h2>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">{{ t('tasks.form.labels.projectGoal') }}</label>
          <textarea data-testid="project-goal" v-model="taskForm.project_goal" rows="4" :placeholder="t('tasks.form.placeholders.projectGoal')" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors resize-none"></textarea>
        </div>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">{{ t('tasks.form.labels.expectedOutcome') }}</label>
          <textarea data-testid="expected-outcome" v-model="taskForm.expected_outcome" rows="4" :placeholder="t('tasks.form.placeholders.expectedOutcome')" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors resize-none"></textarea>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" @click="step = 1" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">{{ t('tasks.form.back') }}</button>
          <button type="button" @click="step = 3" :disabled="!taskForm.project_goal || !taskForm.expected_outcome" class="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 h-11 rounded-md transition-colors disabled:opacity-50 flex-1 cursor-pointer" v-html="t('tasks.form.continue')"></button>
        </div>
      </div>

      <!-- STEP 3 -->
      <div v-if="step === 3" class="space-y-6">
        <h2 class="text-lg font-semibold border-b border-gray-800 pb-3 font-mono text-blue-400">
          {{ t('tasks.form.steps.technical') }}
        </h2>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">{{ t('tasks.form.labels.functionalSpecs') }}</label>
          <textarea data-testid="functional-specs" v-model="taskForm.detailed_technical_description" rows="5" :placeholder="t('tasks.form.placeholders.functionalSpecs')" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors resize-none"></textarea>
        </div>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">{{ t('tasks.form.labels.technologies') }}</label>
          <input v-model="taskForm.required_technologies" type="text" :placeholder="t('tasks.form.placeholders.technologies')" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
        </div>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">{{ t('tasks.form.labels.skills') }}</label>
          <input v-model="taskForm.required_skills" type="text" :placeholder="t('tasks.form.placeholders.skills')" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" @click="step = 2" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">{{ t('tasks.form.back') }}</button>
          <button type="button" @click="step = 4" :disabled="!taskForm.detailed_technical_description" class="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 h-11 rounded-md transition-colors disabled:opacity-50 flex-1 cursor-pointer" v-html="t('tasks.form.continue')"></button>
        </div>
      </div>

      <!-- STEP 4 -->
      <div v-if="step === 4" class="space-y-6">
        <div class="flex justify-between items-center border-b border-gray-800 pb-3">
          <h2 class="text-lg font-semibold font-mono text-blue-400">
            {{ t('tasks.form.steps.requirements') }}
          </h2>
          <button type="button" @click="addDocumentRequirement" class="text-xs bg-blue-950 border border-blue-900 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-900/30 transition-colors cursor-pointer">
            {{ t('tasks.form.labels.addDocument') }}
          </button>
        </div>

        <p class="text-xs text-gray-400 font-mono">{{ t('tasks.form.labels.requirementsDesc') }}</p>

        <div class="space-y-3 max-h-96 overflow-y-auto pr-2">
          <div v-for="(doc, index) in callForm.required_documents" :key="doc.id" class="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950/60 p-4 border border-slate-800 rounded-xl">
            <div class="flex-1 w-full">
              <label class="block text-[10px] font-mono uppercase text-gray-500 mb-1">{{ t('tasks.form.labels.documentLabel') }}</label>
              <input v-model="doc.document_name" type="text" :placeholder="t('tasks.form.placeholders.documentName')" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-blue-500 outline-none text-white" />
            </div>
            <div class="w-28">
              <label class="block text-[10px] font-mono uppercase text-gray-500 mb-1">{{ t('tasks.form.labels.maxSize') }}</label>
              <input v-model="doc.max_size_mb" type="number" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-blue-500 outline-none text-white" />
            </div>
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input v-model="doc.is_mandatory" type="checkbox" class="rounded border-slate-700 text-blue-500 focus:ring-blue-500" />
                <span>{{ t('tasks.form.labels.mandatory') }}</span>
              </label>
            </div>
            <button v-if="callForm.required_documents.length > 1" type="button" @click="removeDocumentRequirement(doc.id)" class="text-xs text-red-400 hover:text-red-300 mt-4 sm:mt-0 pt-2 sm:pt-0 font-mono cursor-pointer">
              {{ t('tasks.form.labels.remove') }}
            </button>
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" @click="step = 3" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">{{ t('tasks.form.back') }}</button>
          <button type="button" @click="step = 5" class="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 h-11 rounded-md transition-colors flex-1 cursor-pointer" v-html="t('tasks.form.continue')"></button>
        </div>
      </div>

      <!-- STEP 5 -->
      <div v-if="step === 5" class="space-y-6">
        <h2 class="text-lg font-semibold border-b border-gray-800 pb-3 font-mono text-blue-400">
          {{ t('tasks.form.steps.attachments') }}
        </h2>

        <p class="text-xs text-gray-400 font-mono">{{ t('tasks.form.labels.attachmentsDesc') }}</p>

        <div class="space-y-4">
          <div v-for="doc in callForm.required_documents.filter(d => d.document_name.trim())" :key="'upload_' + doc.id" class="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs font-medium text-gray-300 font-mono">{{ doc.document_name }}</span>
              <span class="text-[10px] font-mono text-gray-500 uppercase">{{ t('tasks.form.labels.attachedGuideline') }}</span>
            </div>

            <div v-if="isEditMode && (getExistingFileName(doc.type ?? doc.id) || getExistingFileName(doc.type ?? toSnakeCase(doc.document_name)))" class="text-xs text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-900/30 p-2 rounded flex justify-between items-center">
              <span>{{ t('tasks.form.labels.currentFile', { name: getExistingFileName(doc.type ?? doc.id) || getExistingFileName(doc.type ?? toSnakeCase(doc.document_name)) }) }}</span>
              <span class="text-[10px] text-emerald-500 uppercase">{{ t('tasks.form.labels.alreadyUploaded') }}</span>
            </div>

            <div class="relative h-11 border border-dashed border-slate-800 rounded-lg bg-slate-900/30 hover:bg-slate-900/60 transition-colors flex items-center px-4">
              <input type="file" :id="'file_' + doc.id" @change="handleFileChange(doc.id, $event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <label :for="'file_' + doc.id" class="flex justify-between w-full items-center cursor-pointer">
                <span class="text-sm truncate pr-2" :class="files[doc.id] ? 'text-white font-medium' : 'text-gray-600'">
                  {{ files[doc.id]?.name ?? (isEditMode && (getExistingFileName(doc.id) || getExistingFileName(toSnakeCase(doc.document_name))) ? t('tasks.form.labels.replaceFile') : t('tasks.form.labels.chooseFile')) }}
                </span>
                <span class="text-xs bg-blue-900/50 text-blue-300 px-3 py-1 rounded font-mono">{{ t('tasks.form.labels.browse') }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button type="button" @click="step = 4" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">{{ t('tasks.form.back') }}</button>
          <button type="button" @click="submitChallenge('draft')" :disabled="loading" class="border border-blue-600 text-blue-400 hover:bg-blue-600/10 disabled:opacity-50 cursor-pointer flex-1 h-11 rounded-md text-sm font-medium transition-colors font-mono">
            {{ loading ? t('tasks.form.processing') : (isEditMode ? t('tasks.form.updateDraft') : t('tasks.form.saveDraft')) }}
          </button>
          <button type="button" @click="submitChallenge('published')" :disabled="loading" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-white flex-1 h-11 rounded-md text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 font-mono">
            {{ loading ? t('tasks.form.publishing') : (isEditMode ? t('tasks.form.updatePublish') : t('tasks.form.publishChallenge')) }}
          </button>
        </div>
      </div>

    </form>
  </div>
</template>