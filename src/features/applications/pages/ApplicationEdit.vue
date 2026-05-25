<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import api from '@/shared/api/axios'

interface Team {
  id: number
  name: string
  description: string | null
  leader_id: number
  status: string
  members?: any[]
}

interface CallShortInfo {
  id: number
  name: string
  required_documents?: string[] | Record<string, string> | null
  task?: {
    id: number
    title: string
    organization?: { name: string }
  } | null
}

interface ApplicationData {
  id: number
  call_id: number
  team_id: number | null
  program_type: string
  category: string | null
  academic_declaration: boolean | number
  project_title: string | null
  proposed_solution: string | null
}

interface ExistingDocument {
  id: number
  file_name: string
  type: string
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const applicationId = route.params.id

const loading = ref<boolean>(true)
const error = ref<string>('')
const step = ref<number>(1)

const programType = ref<string>('')
const currentCall = ref<CallShortInfo | null>(null)

const selectedTeamId = ref<number | null>(null)
const category = ref<string>('')
const academicDeclaration = ref<boolean>(false)
const projectTitle = ref<string>('')
const proposedSolution = ref<string>('')

const myTeams = ref<Team[]>([])
const existingDocs = ref<ExistingDocument[]>([])
const files = ref<Record<string, File | null>>({})

const categories = [
  'Software Development',
  'AI & Data Technologies',
  'Web Applications',
  'Game Development',
  'IoT & Embedded Systems',
]

const defaultDocLabels: Record<string, string> = {
  executive_summary: 'Executive Summary',
  technical_architecture: 'Technical Architecture',
  roadmap: 'Project Roadmap',
  budget: 'Project Budget',
  risk_analysis: 'Risk Analysis',
  monetization_model: 'Monetization Model',
  cv: 'CV (All team members in a single PDF file)',
  motivation_letter: 'Motivation Letter',
}

const docLabels = computed<Record<string, string>>(() => {
  if (!currentCall.value || !currentCall.value.required_documents) {
    return defaultDocLabels
  }

  const reqDocs = currentCall.value.required_documents

  if (Array.isArray(reqDocs)) {
    const labels: Record<string, string> = {}
    reqDocs.forEach((item: any) => {
      if (!item) return
      
      if (typeof item === 'string') {
        const cleanKey = item.toLowerCase().replace(/\s+/g, '_')
        labels[cleanKey] = defaultDocLabels[cleanKey] || defaultDocLabels[item] || `${item.replace(/_/g, ' ').toUpperCase()}`
      } else if (typeof item === 'object') {
        const rawKey = item.slug || item.key || item.type || item.document_name || String(item.id)
        const systemKey = String(rawKey).toLowerCase().replace(/\s+/g, '_')
        const visualLabel = item.document_name || item.name || item.label || defaultDocLabels[systemKey] || `Document ${systemKey}`
        
        labels[systemKey] = visualLabel
      }
    })
    return labels
  }

  if (typeof reqDocs === 'object') {
    return reqDocs as Record<string, string>
  }

  return defaultDocLabels
})

onMounted(async () => {
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }

  try {
    const [appRes, teamsRes] = await Promise.all([
      api.get<ApplicationData>(`/applications/${applicationId}`),
      api.get<Team[]>('/teams')
    ])

    const appData = appRes.data
    console.log(appData)
    programType.value = appData.program_type
    myTeams.value = Array.isArray(teamsRes.data) ? teamsRes.data : []

    selectedTeamId.value = appData.team_id
    category.value = appData.category || ''
    academicDeclaration.value = !!appData.academic_declaration
    projectTitle.value = appData.project_title || ''
    proposedSolution.value = appData.proposed_solution || ''

    const [callRes, docsRes] = await Promise.all([
      api.get<CallShortInfo>(`/calls/${appData.call_id}`),
      api.get<ExistingDocument[]>(`/applications/${applicationId}/documents`) 
    ])

    currentCall.value = callRes.data
    existingDocs.value = Array.isArray(docsRes.data) ? docsRes.data : []

    if (programType.value === 'b' && !projectTitle.value && callRes.data?.task) {
      projectTitle.value = callRes.data.task.title || ''
    }

  } catch (err: any) {
    console.error('Failed to load lifecycle application context:', err)
    error.value = 'Could not retrieve database parameters for this application.'
  } finally {
    loading.value = false
  }
})

function onFileChange(key: string, event: Event): void {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    files.value[key] = input.files[0]
  }
}

function nextStep(): void {
  error.value = ''
  if (programType.value === 'a') {
    if (!selectedTeamId.value) { error.value = 'Please select a qualified team'; return }
    if (!category.value) { error.value = 'Please select a focus category'; return }
    if (!academicDeclaration.value) { error.value = 'You must confirm your academic eligibility declaration'; return }
  } else {
    if (!projectTitle.value.trim()) { error.value = 'Please specify the project specifications title'; return }
    if (!proposedSolution.value.trim()) { error.value = 'Please supply your proposed architectural concept outline'; return }
  }
  step.value = 2
}

async function submit(): Promise<void> {
  error.value = ''
  loading.value = true

  try {
    const payload: Record<string, any> = {
      program_type: programType.value,
      applicant_type: 'team'
    }

    if (programType.value === 'a') {
      payload.team_id = selectedTeamId.value
      payload.category = category.value
      payload.academic_declaration = academicDeclaration.value ? 1 : 0
    } else {
      payload.team_id = selectedTeamId.value
      payload.project_title = projectTitle.value
      payload.proposed_solution = proposedSolution.value
    }

    await api.patch(`/applications/${applicationId}`, payload)

    for (const [type, file] of Object.entries(files.value)) {
      if (!file) continue
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('classification', 'confidential')
      formData.append('application_id', String(applicationId))

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    router.push(`/applications/${applicationId}`)
  } catch (err: any) {
    error.value = err?.response?.data?.message || 'Something went wrong while updating the context fields.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col justify-center items-center min-h-screen py-10 px-4 bg-slate-950 text-gray-300">
    <div class="w-full max-w-xl bg-slate-900/40 p-8 border border-slate-900 rounded-2xl relative backdrop-blur-md">
      
      <div v-if="loading" class="text-center py-10 text-sm text-slate-400">
        Loading existing application parameters from database...
      </div>

      <div v-else>
        <div class="mb-6">
          <span class="text-[10px] uppercase font-bold tracking-wider text-blue-400 block mb-1">
            Editing Mode: Application #{{ applicationId }}
          </span>
          <h2 class="text-2xl font-bold text-white">
            {{ programType === 'a' ? 'Program A Incubation' : 'Program B Challenge' }} Setup
          </h2>
          <p class="text-xs text-slate-500 mt-1">Step {{ step }} of 2: Review and change metadata structures</p>
        </div>

        <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/60 p-3 rounded-xl border border-red-900/50">{{ error }}</p>

        <div v-if="step === 1" class="flex flex-col gap-5">
          
          <div>
            <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">Assigned Team *</label>
            <select v-model="selectedTeamId" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer">
              <option v-for="team in myTeams" :key="team.id" :value="team.id">
                {{ team.name }} (Status: {{ team.status }})
              </option>
            </select>
          </div>

          <template v-if="programType === 'a'">
            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">Incubation Track Category *</label>
              <select v-model="category" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer">
                <option value="" disabled>Select a track</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="p-4 bg-blue-950/20 border border-blue-900/50 rounded-xl mt-2">
              <label class="flex items-start gap-3 cursor-pointer select-none">
                <input v-model="academicDeclaration" type="checkbox" class="mt-1 accent-blue-500 rounded" />
                <span class="text-xs text-gray-400 leading-normal">
                  I declare that I have no carried-over courses and my average grade of core courses meets the required threshold. I understand this will be verified by the committee. *
                </span>
              </label>
            </div>
          </template>

          <template v-else>
            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">Project Name / Specifications *</label>
              <input v-model="projectTitle" type="text" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm" />
            </div>

            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">Solution Outline *</label>
              <textarea v-model="proposedSolution" rows="5" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white resize-none focus:border-blue-600 transition outline-none text-sm"></textarea>
            </div>
          </template>

          <div class="flex gap-3 mt-2">
            <button @click="router.back()" class="w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium">Cancel</button>
            <button @click="nextStep" class="flex-1 bg-blue-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm">
              Next: Review Documentation
            </button>
          </div>
        </div>

        <div v-else-if="step === 2" class="flex flex-col gap-4">
          <div class="p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-400 leading-relaxed">
            Below, you can view the current documents or upload new files to the appropriate slots. Uploading new files will overwrite the previous versions.
          </div>

          <div v-for="(label, key) in docLabels" :key="key" class="border border-slate-950 p-4 rounded-xl bg-slate-950/60">
            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{{ label }}</label>
            
            <div class="text-[11px] text-blue-400 mb-2 flex items-center gap-1.5 font-medium">
              <span>📋 Current file:</span>
              <span class="underline italic">
                {{ 
                  existingDocs.find(d => String(d.type).toLowerCase().replace(/\s+/g, '_') === String(key).toLowerCase().replace(/\s+/g, '_'))?.file_name || 'Не завантажено' 
                }}
              </span>
            </div>

            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" @change="onFileChange(String(key), $event)" class="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-950 file:text-blue-400 hover:file:bg-blue-900 file:cursor-pointer transition" />
            <p v-if="files[key]" class="text-xs text-green-400 mt-2 font-medium">✓ Вибрано для заміни: {{ files[key]?.name }}</p>
          </div>

          <div class="flex gap-4 mt-4">
            <button @click="step = 1" class="w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium">Back</button>
            <button @click="submit" :disabled="loading" class="flex-1 bg-blue-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm shadow-lg shadow-blue-950">
              {{ loading ? 'Saving...' : 'Save Structural Changes' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>