<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPrograms } from '@/shared/api/programs'
import { createCallWithTask } from '@/features/tasks/api/tasks'
import type { Program } from '@/shared/types/programs'

interface TaskDocumentRequirement {
  id: string
  document_name: string
  is_mandatory: boolean
  max_size_mb: number
}

const router = useRouter()

const step = ref(1)
const loading = ref(false)
const error = ref('')

const programBId = ref<number | null>(null)

const taskForm = ref({
  title: '',
  short_description: '',
  project_goal: '',
  expected_outcome: '',
  detailed_technical_description: '',
  required_technologies: '',
  architecture_requirements: '',
  platforms: '',
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

const files = ref<Record<string, File | null>>({
  technical_doc: null,
  wireframes: null,
  specifications: null
})

const docLabels: Record<string, string> = {
  technical_doc: 'Technical Documentation (PDF)',
  wireframes: 'Wireframes / Images',
  specifications: 'PDF Specifications'
}

onMounted(async () => {
  try {
    const res = await getPrograms()
    const progB = res.data.find((p: Program) => p.code === 'program_b')
    if (progB) {
      programBId.value = progB.id
    }
    console.log(programBId.value)
  } catch (err: any) {
    console.error('Error fetching programs:', err)
  }
})

function addDocumentRule() {
  callForm.value.required_documents.push({
    id: Date.now().toString(),
    document_name: '',
    is_mandatory: true,
    max_size_mb: 5
  })
}

function removeDocumentRule(index: number) {
  callForm.value.required_documents.splice(index, 1)
}

function onFileChange(key: string, event: Event) {
  const input = event.target as HTMLInputElement
  files.value[key] = input.files?.[0] ?? null
}

async function submitChallenge(targetStatus: 'draft' | 'published') {
  loading.value = true
  error.value = ''

  try {
    const formData = new FormData()

    formData.append('program_type', 'b')
    formData.append('call_opens_at', callForm.value.opens_at)
    formData.append('call_deadline_at', callForm.value.deadline_at)
    formData.append('min_team_size', String(callForm.value.min_team_size))
    if (callForm.value.max_team_size) {
      formData.append('max_team_size', String(callForm.value.max_team_size))
    }
    formData.append('required_documents', JSON.stringify(callForm.value.required_documents))

    formData.append('status', targetStatus)
    formData.append('title', taskForm.value.title)
    formData.append('short_description', taskForm.value.short_description)
    formData.append('project_goal', taskForm.value.project_goal)
    formData.append('expected_outcome', taskForm.value.expected_outcome)
    formData.append('detailed_technical_description', taskForm.value.detailed_technical_description)
    formData.append('architecture_requirements', taskForm.value.architecture_requirements)
    formData.append('platforms', taskForm.value.platforms)
    if (taskForm.value.budget) {
      formData.append('budget', String(taskForm.value.budget))
    }
    formData.append('deadline', taskForm.value.deadline)

    const techs = taskForm.value.required_technologies.split(',').map(s => s.trim()).filter(Boolean)
    const skills = taskForm.value.required_skills.split(',').map(s => s.trim()).filter(Boolean)
    
    techs.forEach(t => formData.append('required_technologies[]', t))
    skills.forEach(s => formData.append('required_skills[]', s))

    for (const [key, file] of Object.entries(files.value)) {
      if (file) {
        formData.append(`files[${key}]`, file) 
      }
    }

    await createCallWithTask(formData)

    step.value = 6
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error while saving the task.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex-center-page py-10">
    <div class="w-full max-w-4xl">

      <div class="mb-8 text-center">
        <div class="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-600/10 border border-blue-900 px-4 py-1.5 rounded-full mb-4">
          Program B
        </div>
        <h1 class="font-bold text-4xl text-white">Create Challenge & Call</h1>
        <p class="text-gray-400 mt-2 text-sm">Define the project details and student application rules</p>
      </div>

      <!-- Stepper Progress -->
      <div class="flex items-center mb-8 overflow-x-auto pb-2">
        <template v-for="s in 5" :key="s">
          <div class="flex flex-col items-center flex-shrink-0">
            <div :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border transition-colors',
              step >= s ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500'
            ]">
              {{ s }}
            </div>
            <span :class="['text-[10px] mt-1.5 uppercase tracking-wider', step >= s ? 'text-blue-400' : 'text-gray-600']">
              {{ s === 1 ? 'General' : s === 2 ? 'Tech' : s === 3 ? 'Window' : s === 4 ? 'Student Docs' : 'Uploads' }}
            </span>
          </div>
          <div v-if="s < 5" :class="['flex-1 h-px mx-2 mb-4 min-w-[30px]', step > s ? 'bg-blue-600' : 'bg-blue-900']"></div>
        </template>
      </div>

      <!-- Success Screen (Step 6) -->
      <div v-if="step === 6" class="text-center py-12 bg-slate-900/50 border border-blue-900/50 rounded-xl">
        <div class="text-5xl mb-4 text-green-400">✓</div>
        <h2 class="text-2xl font-bold text-white mb-2">Challenge & Call Created</h2>
        <p class="text-gray-400 text-sm mb-6 max-w-md mx-auto">
          Your company challenge and the corresponding application window have been successfully submitted.
        </p>
        <button @click="router.push('/dashboard')" class="bg-blue-600 hover:bg-blue-700 text-white px-8 h-10 rounded-md text-sm cursor-pointer">
          Go to Dashboard
        </button>
      </div>

      <div v-else class="bg-slate-900/50 border border-blue-900/50 rounded-xl p-6 md:p-8">
        <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-400/10 p-3 rounded">{{ error }}</p>

        <!-- STEP 1: General Info -->
        <form v-if="step === 1" @submit.prevent="step = 2" class="flex flex-col gap-5">
          <h2 class="text-lg font-semibold text-white border-b border-blue-900/50 pb-2">1. General Project Information</h2>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Project Title <span class="text-red-400">*</span></label>
            <input v-model="taskForm.title" required type="text" placeholder="e.g. AI Recruitment Platform" class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-10 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Short Description <span class="text-red-400">*</span></label>
            <textarea v-model="taskForm.short_description" required placeholder="Brief summary of the challenge..." class="bg-blue-600/10 border border-blue-900 rounded-md w-full min-h-[90px] p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Budget (€)</label>
              <input v-model.number="taskForm.budget" type="number" placeholder="5000" class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-10 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Project Delivery Deadline</label>
              <input v-model="taskForm.deadline" type="date" class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-10 px-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white w-full h-11 mt-4 rounded-md text-sm font-medium transition cursor-pointer">Continue to Tech Specs →</button>
        </form>

        <!-- STEP 2: Tech Specs -->
        <form v-if="step === 2" @submit.prevent="step = 3" class="flex flex-col gap-5">
          <h2 class="text-lg font-semibold text-white border-b border-blue-900/50 pb-2">2. Technical Specifications</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Project Goal</label>
              <textarea v-model="taskForm.project_goal" placeholder="What problem should be solved?" class="bg-blue-600/10 border border-blue-900 rounded-md w-full min-h-[100px] p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Expected Outcome</label>
              <textarea v-model="taskForm.expected_outcome" placeholder="Expected deliverables..." class="bg-blue-600/10 border border-blue-900 rounded-md w-full min-h-[100px] p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Detailed Technical Description</label>
            <textarea v-model="taskForm.detailed_technical_description" placeholder="Architecture, APIs, integrations, infrastructure..." class="bg-blue-600/10 border border-blue-900 rounded-md w-full min-h-[120px] p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Required Technologies</label>
              <input v-model="taskForm.required_technologies" placeholder="Laravel, Vue, Docker (comma separated)" class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-10 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Required Skills</label>
              <input v-model="taskForm.required_skills" placeholder="Backend, DevOps (comma separated)" class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-10 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div class="flex gap-3 mt-4">
            <button type="button" @click="step = 1" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">← Back</button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-11 rounded-md text-sm font-medium transition cursor-pointer">Continue to Application Window →</button>
          </div>
        </form>

        <!-- STEP 3: Call Window -->
        <form v-if="step === 3" @submit.prevent="step = 4" class="flex flex-col gap-5">
          <h2 class="text-lg font-semibold text-white border-b border-blue-900/50 pb-2">3. Application Window (Call Settings)</h2>
          <p class="text-gray-400 text-xs">Define when students can apply and team constraints.</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Applications Open At <span class="text-red-400">*</span></label>
              <input v-model="callForm.opens_at" required type="date" class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-10 px-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Applications Deadline <span class="text-red-400">*</span></label>
              <input v-model="callForm.deadline_at" required type="date" class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-10 px-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Min Team Size</label>
              <input v-model.number="callForm.min_team_size" type="number" min="1" class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-10 px-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1">Max Team Size (optional)</label>
              <input v-model.number="callForm.max_team_size" type="number" min="1" class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-10 px-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div class="flex gap-3 mt-4">
            <button type="button" @click="step = 2" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">← Back</button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-11 rounded-md text-sm font-medium transition cursor-pointer">Continue to Document Rules →</button>
          </div>
        </form>

        <!-- STEP 4: Student Documents -->
        <form v-if="step === 4" @submit.prevent="step = 5" class="flex flex-col gap-5">
          <h2 class="text-lg font-semibold text-white border-b border-blue-900/50 pb-2">4. Required Documents from Students</h2>
          <p class="text-gray-400 text-xs">What files must students upload when applying to this challenge?</p>
          
          <div class="flex flex-col gap-2">
            <div v-for="(doc, index) in callForm.required_documents" :key="doc.id" class="flex flex-wrap items-center gap-3 bg-slate-950 p-3 rounded-md border border-blue-900/60">
              <input v-model="doc.document_name" required type="text" placeholder="e.g. CV, Motivation Letter" class="flex-1 bg-transparent border-b border-blue-900/60 focus:border-blue-500 h-8 px-1 text-sm text-white focus:outline-none min-w-[150px]" />
              <div class="flex items-center gap-1 text-xs text-gray-400">
                <input v-model.number="doc.max_size_mb" type="number" min="1" class="w-14 bg-slate-900 border border-blue-900/60 h-8 text-center text-white rounded focus:outline-none" />
                <span>MB</span>
              </div>
              <label class="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                <input type="checkbox" v-model="doc.is_mandatory" class="accent-blue-500 w-4 h-4" />
                Mandatory
              </label>
              <button type="button" @click="removeDocumentRule(index)" class="text-red-400 hover:text-red-500 ml-auto px-2">✕</button>
            </div>
            <button type="button" @click="addDocumentRule" class="text-blue-400 text-sm hover:text-blue-300 self-start mt-2 font-medium">+ Add Document Requirement</button>
          </div>

          <div class="flex gap-3 mt-4">
            <button type="button" @click="step = 3" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">← Back</button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-11 rounded-md text-sm font-medium transition cursor-pointer">Continue to Final Uploads →</button>
          </div>
        </form>

        <!-- STEP 5: Attachments & Submit -->
        <div v-if="step === 5" class="flex flex-col gap-5">
          <h2 class="text-lg font-semibold text-white border-b border-blue-900/50 pb-2">5. Company Attachments & Publish</h2>
          <p class="text-gray-400 text-xs">Upload your technical materials for the students.</p>

          <div v-for="(label, key) in docLabels" :key="key">
            <label class="block text-xs font-medium text-gray-400 mb-1">{{ label }}</label>
            <div class="relative">
              <input type="file" class="hidden" :id="`file-${key}`" @change="onFileChange(key, $event)" />
              <label :for="`file-${key}`" class="flex items-center justify-between bg-blue-600/10 border border-blue-900 hover:border-blue-600 rounded-md px-4 h-11 cursor-pointer transition-colors" :class="{ 'border-blue-500': files[key] }">
                <span class="text-sm truncate pr-2" :class="files[key] ? 'text-white' : 'text-gray-600'">{{ files[key]?.name ?? 'Choose file...' }}</span>
                <span class="text-xs bg-blue-900/50 text-blue-300 px-3 py-1 rounded">Browse</span>
              </label>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button type="button" @click="step = 4" class="border border-blue-900 text-gray-400 hover:text-white px-6 rounded-md text-sm cursor-pointer transition-colors">← Back</button>
            <button type="button" @click="submitChallenge('draft')" :disabled="loading" class="border border-blue-600 text-blue-400 hover:bg-blue-600/10 disabled:opacity-50 cursor-pointer flex-1 h-11 rounded-md text-sm font-medium transition-colors">
              {{ loading ? 'Processing...' : 'Save as Draft' }}
            </button>
            <button type="button" @click="submitChallenge('published')" :disabled="loading" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-white flex-1 h-11 rounded-md text-sm font-medium transition-colors shadow-lg shadow-blue-900/20">
              {{ loading ? 'Publishing...' : 'Publish Challenge' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.flex-center-page {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background-color: #020617; /* slate-950 */
}
</style>