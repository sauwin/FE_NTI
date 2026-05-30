<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getPrograms } from '@/shared/api/programs'
import { getCompanyTasks } from '@/features/company/api/company'
import { createCallWithTask, updateCallWithTask } from '@/features/tasks/api/tasks'
import type { Program } from '@/shared/types/programs'

interface TaskDocumentRequirement {
  id: string
  document_name: string
  is_mandatory: boolean
  max_size_mb: number
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
    { id: Date.now().toString(), document_name: 'Team Project Pitch (PDF)', is_mandatory: true, max_size_mb: 10 }
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
              callForm.value.required_documents = reqDocs.map((doc: any, idx: number) => ({
                id: doc.id || Date.now().toString() + idx,
                document_name: doc.document_name || doc,
                is_mandatory: doc.is_mandatory !== undefined ? doc.is_mandatory : true,
                max_size_mb: doc.max_size_mb || 10
              }))
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
        error.value = 'Task not found or access denied.'
      }
    }
  } catch (err: any) {
    error.value = 'Failed to initialize form data.'
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

  const docsPayload = callForm.value.required_documents
    .filter(d => d.document_name.trim().length > 0)
    .map(d => ({
      id: d.id,
      document_name: d.document_name,
      is_mandatory: d.is_mandatory,
      max_size_mb: d.max_size_mb
    }))
  
  fd.append('required_documents', JSON.stringify(docsPayload))

  Object.keys(files.value).forEach((key) => {
    const file = files.value[key]
    if (file) {
      fd.append(`files[${key}]`, file)
    }
  })

  try {
    if (isEditMode.value && taskId.value) {
      fd.append('_method', 'PUT')
      await updateCallWithTask(taskId.value, fd)
    } else {
      await createCallWithTask(fd)
    }
    
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'An error occurred while saving the challenge.'
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
        {{ isEditMode ? 'Edit Innovation Challenge' : 'Launch New Innovation Challenge' }}
      </h1>
      <p class="text-sm text-gray-400 mt-1">
        {{ isEditMode ? 'Modify your project requirements, goals and associated files.' : 'Formulate a business problem statement for tech teams and student groups.' }}
      </p>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-red-900/20 border border-red-500/40 text-red-400 rounded-xl text-sm">
      {{ error }}
    </div>

    <div class="grid grid-cols-5 gap-2 mb-10 text-center text-xs font-mono">
      <div v-for="i in 5" :key="i" class="h-1 rounded transition-colors" :class="step >= i ? 'bg-blue-500' : 'bg-gray-800'"></div>
    </div>

    <form @submit.prevent class="space-y-8 bg-slate-900/40 border border-slate-800 p-8 rounded-2xl">
      
      <div v-if="step === 1" class="space-y-6">
        <h2 class="text-lg font-semibold border-b border-gray-800 pb-3 font-mono text-blue-400">01 / BASIC METADATA</h2>
        
        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">Challenge Title</label>
          <input v-model="taskForm.title" type="text" placeholder="e.g., AI-Driven Inventory Optimization System" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
        </div>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">Short Teaser Description</label>
          <textarea v-model="taskForm.short_description" rows="3" placeholder="A single paragraph summarizing the high-level challenge for external viewers..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors resize-none"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">Budget Allocation (EUR)</label>
            <input v-model="taskForm.budget" type="number" placeholder="Optional financial reward" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">Final Delivery Deadline</label>
            <input v-model="taskForm.deadline" type="date" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
          </div>
        </div>

        <div class="flex justify-end pt-4">
          <button type="button" @click="step = 2" :disabled="!taskForm.title || !taskForm.short_description" class="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 h-11 rounded-md transition-colors disabled:opacity-50 cursor-pointer">Continue &rarr;</button>
        </div>
      </div>

      <div v-if="step === 2" class="space-y-6">
        <h2 class="text-lg font-semibold border-b border-gray-800 pb-3 font-mono text-blue-400">02 / PROBLEM STATEMENT & GOALS</h2>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">Project Vision & Strategic Goal</label>
          <textarea v-model="taskForm.project_goal" rows="4" placeholder="What business problem are we trying to solve? What is the main driver behind this request?" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors resize-none"></textarea>
        </div>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">Expected Outcome & Success Metrics</label>
          <textarea v-model="taskForm.expected_outcome" rows="4" placeholder="Describe what the final prototype or software stack must achieve to be considered successful..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors resize-none"></textarea>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" @click="step = 1" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">← Back</button>
          <button type="button" @click="step = 3" :disabled="!taskForm.project_goal || !taskForm.expected_outcome" class="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 h-11 rounded-md transition-colors disabled:opacity-50 flex-1 cursor-pointer">Continue &rarr;</button>
        </div>
      </div>

      <div v-if="step === 3" class="space-y-6">
        <h2 class="text-lg font-semibold border-b border-gray-800 pb-3 font-mono text-blue-400">03 / TECHNICAL SPECIFICATIONS</h2>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">Detailed Functional Specifications</label>
          <textarea v-model="taskForm.detailed_technical_description" rows="5" placeholder="List key features, specific user journeys, background cron-jobs, or analytical calculations needed..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors resize-none"></textarea>
        </div>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">Required Technologies (Comma separated)</label>
          <input v-model="taskForm.required_technologies" type="text" placeholder="Vue 3, Node.js, PostgreSQL, Docker, Python" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
        </div>

        <div>
          <label class="block text-xs uppercase font-mono tracking-wider text-gray-400 mb-2">Preferred Team Profile / Core Skills</label>
          <input v-model="taskForm.required_skills" type="text" placeholder="REST APIs, State Management, Database Indexing" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" @click="step = 2" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">← Back</button>
          <button type="button" @click="step = 4" :disabled="!taskForm.detailed_technical_description" class="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 h-11 rounded-md transition-colors disabled:opacity-50 flex-1 cursor-pointer">Continue &rarr;</button>
        </div>
      </div>

      <div v-if="step === 4" class="space-y-6">
        <div class="flex justify-between items-center border-b border-gray-800 pb-3">
          <h2 class="text-lg font-semibold font-mono text-blue-400">04 / APPLICATION REQUIREMENTS</h2>
          <button type="button" @click="addDocumentRequirement" class="text-xs bg-blue-950 border border-blue-900 text-blue-400 px-3 py-1.5 rounded hover:bg-blue-900/30 transition-colors cursor-pointer">+ Add Document Type</button>
        </div>

        <p class="text-xs text-gray-400 font-mono">Define what files applying solver squads must upload in order to sign up for your challenge.</p>

        <div class="space-y-3 max-h-96 overflow-y-auto pr-2">
          <div v-for="(doc, index) in callForm.required_documents" :key="doc.id" class="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950/60 p-4 border border-slate-800 rounded-xl">
            <div class="flex-1 w-full">
              <label class="block text-[10px] font-mono uppercase text-gray-500 mb-1">Document Label</label>
              <input v-model="doc.document_name" type="text" placeholder="e.g., Financial Blueprint Breakdown" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-blue-500 outline-none text-white" />
            </div>
            <div class="w-28">
              <label class="block text-[10px] font-mono uppercase text-gray-500 mb-1">Max Size (MB)</label>
              <input v-model="doc.max_size_mb" type="number" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:border-blue-500 outline-none text-white" />
            </div>
            <div class="flex items-center gap-2 mt-4 sm:mt-0 pt-2 sm:pt-0">
              <input :id="'chk_' + doc.id" v-model="doc.is_mandatory" type="checkbox" class="rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-800 w-4 h-4 cursor-pointer" />
              <label :for="'chk_' + doc.id" class="text-xs font-mono text-gray-400 uppercase select-none cursor-pointer">Mandatory</label>
            </div>
            <button v-if="callForm.required_documents.length > 1" type="button" @click="removeDocumentRequirement(doc.id)" class="text-xs text-red-400 hover:text-red-300 mt-4 sm:mt-0 pt-2 sm:pt-0 font-mono cursor-pointer">[Remove]</button>
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <button type="button" @click="step = 3" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">← Back</button>
          <button type="button" @click="step = 5" class="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 h-11 rounded-md transition-colors flex-1 cursor-pointer">Continue &rarr;</button>
        </div>
      </div>

      <div v-if="step === 5" class="space-y-6">
        <h2 class="text-lg font-semibold border-b border-gray-800 pb-3 font-mono text-blue-400">05 / COMPANY ATTACHMENTS & SUBMIT</h2>

        <p class="text-xs text-gray-400 font-mono">Upload any extra guidelines, internal data models, architecture charts, or API files to assist teams.</p>

        <div class="space-y-4">
          <div v-for="doc in callForm.required_documents.filter(d => d.document_name.trim())" :key="'upload_' + doc.id" class="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs font-medium text-gray-300 font-mono">{{ doc.document_name }}</span>
              <span class="text-[10px] font-mono text-gray-500 uppercase">{{ doc.is_mandatory ? 'Required File' : 'Optional File' }}</span>
            </div>

            <div v-if="isEditMode && getExistingFileName(doc.id)" class="text-xs text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-900/30 p-2 rounded flex justify-between items-center">
              <span>📄 Current: {{ getExistingFileName(doc.id) }}</span>
              <span class="text-[10px] text-emerald-500 uppercase">(Already Uploaded)</span>
            </div>

            <div class="relative h-11 border border-dashed border-slate-800 rounded-lg bg-slate-900/30 hover:bg-slate-900/60 transition-colors flex items-center px-4">
              <input type="file" :id="'file_' + doc.id" @change="handleFileChange(doc.id, $event)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <label :for="'file_' + doc.id" class="flex justify-between w-full items-center cursor-pointer">
                <span class="text-sm truncate pr-2" :class="files[doc.id] ? 'text-white font-medium' : 'text-gray-600'">
                  {{ files[doc.id]?.name ?? (isEditMode && getExistingFileName(doc.id) ? 'Choose new file to replace...' : 'Choose file...') }}
                </span>
                <span class="text-xs bg-blue-900/50 text-blue-300 px-3 py-1 rounded font-mono">Browse</span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button type="button" @click="step = 4" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">← Back</button>
          <button type="button" @click="submitChallenge('draft')" :disabled="loading" class="border border-blue-600 text-blue-400 hover:bg-blue-600/10 disabled:opacity-50 cursor-pointer flex-1 h-11 rounded-md text-sm font-medium transition-colors font-mono">
            {{ loading ? 'Processing...' : (isEditMode ? 'Update as Draft' : 'Save as Draft') }}
          </button>
          <button type="button" @click="submitChallenge('published')" :disabled="loading" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-white flex-1 h-11 rounded-md text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 font-mono">
            {{ loading ? 'Publishing...' : (isEditMode ? 'Update & Publish' : 'Publish Challenge') }}
          </button>
        </div>
      </div>

    </form>
  </div>
</template>