<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/shared/api/axios'
import { useAuthStore } from '@/features/auth/stores/auth'

interface Team {
  id: number
  name: string
  description: string | null
  leader_id: number
  status: string
}

interface CallShortInfo {
  id: number
  name: string
  task_id?: number
  required_documents?: string[] | Record<string, string> | null
  task?: {
    id: number
    title: string
    organization?: { name: string }
  } | null
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const urlId = computed<number | null>(() => {
  const idParam = route.params.callId || route.params.id || route.query.id
  return idParam ? Number(idParam) : null
})

const resolvedCallId = ref<number | null>(null)
const currentCall = ref<CallShortInfo | null>(null)
const myTeams = ref<Team[]>([])
const selectedTeamId = ref<number | null>(null)

const error = ref<string>('')
const loading = ref<boolean>(false)
const step = ref<number>(1)

const projectTitle = ref<string>('')
const proposedSolution = ref<string>('')

const files = ref<Record<string, File | null>>({})

const defaultDocLabels: Record<string, string> = {
  cv: 'CV (All team members in a single PDF file)',
  motivation_letter: 'Motivation Letter',
  technical_proposal: 'Technical Proposal / Solution Concept',
}

const docLabels = computed<Record<string, string>>(() => {
  if (!currentCall.value || !currentCall.value.required_documents) {
    return defaultDocLabels
  }

  const reqDocs = currentCall.value.required_documents

  // If the backend returns an array
  if (Array.isArray(reqDocs)) {
    const labels: Record<string, string> = {}
    
    reqDocs.forEach((item: any) => {
      if (!item) return

      // Scenario A: Array of plain strings -> ['cv', 'motivation_letter']
      if (typeof item === 'string') {
        labels[item] = defaultDocLabels[item] || `${item.replace(/_/g, ' ').toUpperCase()}`
      } 
      // Scenario B: Array of relational objects -> [{ id: 1, name: 'Motivation Letter', slug: 'motivation_letter' }]
      else if (typeof item === 'object') {
        // Системний ключ для передачі на бекенд (пріоритет на id або slug)
        const systemKey = String(item.id || item.slug || item.key || JSON.stringify(item))
        
        // Візуальна назва документа, яку побачить студент (пріоритет на name, document_name або label)
        const visualLabel = item.name || item.document_name || item.label || defaultDocLabels[systemKey] || `Document ${systemKey}`
        
        labels[systemKey] = visualLabel
      }
      // Scenario C: Array of IDs -> [1, 2, 3]
      else {
        const key = String(item)
        labels[key] = defaultDocLabels[key] || `Document Requirement #${key}`
      }
    })
    
    return labels
  }

  // If the backend returns a flat key-value object -> { "1": "Motivation Letter" }
  if (typeof reqDocs === 'object') {
    return reqDocs as Record<string, string>
  }

  return defaultDocLabels
})

watch(docLabels, (newLabels) => {
  const newFilesState: Record<string, File | null> = {}
  Object.keys(newLabels).forEach((key) => {
    newFilesState[key] = files.value[key] || null
  })
  files.value = newFilesState
}, { immediate: true })

onMounted(async () => {
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }

  if (!urlId.value || isNaN(urlId.value)) {
    error.value = 'Critical error: Target Call ID not found or invalid in URL.'
    return
  }

  loading.value = true

  // 1. Fetch Student Teams
  try {
    const teamsRes = await api.get<Team[]>('/teams')
    myTeams.value = Array.isArray(teamsRes.data) ? teamsRes.data : []
    if (myTeams.value[0]) {
      selectedTeamId.value = myTeams.value[0].id
    }
  } catch (err) {
    console.error('Unable to load student teams:', err)
  }

  // 2. Fetch Call Details Directly Using Call ID
  try {
    const callRes = await api.get<CallShortInfo>(`/calls/${urlId.value}`)
    currentCall.value = callRes.data
    resolvedCallId.value = callRes.data.id
    
    // Automatically fill title from the nested task structure
    if (callRes.data && callRes.data.task) {
      projectTitle.value = callRes.data.task.title || ''
    }
  } catch (err: any) {
    console.error('Error loading call details:', err)
    error.value = 'The program application details could not be found for this call context.'
  } finally {
    loading.value = false
  }
})

function onFileChange(type: string, event: Event): void {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    files.value[type] = input.files[0]
  }
}

function nextStep(): void {
  error.value = ''
  if (!selectedTeamId.value) { error.value = 'Please select or create a team'; return }
  if (!projectTitle.value.trim()) { error.value = 'Please enter the project name'; return }
  if (!proposedSolution.value.trim()) { error.value = 'Please describe the concept behind your solution'; return }
  step.value = 2
}

async function submit(): Promise<void> {
  if (!resolvedCallId.value) { error.value = 'No call ID identified'; return }
  error.value = ''
  loading.value = true

  for (const key of Object.keys(docLabels.value)) {
    if (!files.value[key]) {
      error.value = `Please upload the required document: ${docLabels.value[key]}`
      loading.value = false
      return
    }
  }

  try {
    const applicationPayload = {
      applicant_type: 'team', 
      program_type: 'b',
      call_id: resolvedCallId.value,
      team_id: selectedTeamId.value, 
      project_title: projectTitle.value,
      proposed_solution: proposedSolution.value
    }

    const appRes = await api.post<{ id?: number; application_id?: number }>('/applications', applicationPayload)
    const applicationId = appRes.data.application_id || appRes.data.id || 0

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

    step.value = 3
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Something went wrong while submitting the form.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col justify-center items-center min-h-screen py-10 px-4 bg-slate-950 text-gray-300">

    <div class="w-full max-w-xl bg-slate-900/40 p-8 border border-slate-900 rounded-2xl relative overflow-hidden backdrop-blur-md">
      
      <div v-if="loading" class="text-center py-10 text-sm text-slate-400">
        Loading context parameters...
      </div>

      <div v-else>
        <div v-if="currentCall?.task && step !== 3" class="mb-6 p-4 bg-blue-950/40 border border-blue-900/60 rounded-xl">
          <span class="text-[10px] uppercase font-bold tracking-wider text-blue-400 block mb-1">You are applying for:</span>
          <h4 class="text-base font-bold text-white leading-tight">{{ currentCall.task.title }}</h4>
          <p class="text-xs text-slate-400 mt-1">Organization: {{ currentCall.task.organization?.name || 'Program partner' }}</p>
        </div>

        <div v-if="step === 1">
          <h2 class="text-2xl font-bold text-white mb-1">Application for Participation</h2>
          <p class="text-xs text-slate-500 mb-6">Step 1 of 2: Project Description and Team Selection</p>
          
          <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/60 p-3 rounded-xl border border-red-900/50">{{ error }}</p>
          
          <div class="flex flex-col gap-5">
            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">Choose your team *</label>
              
              <div v-if="myTeams.length === 0" class="p-3 border border-dashed border-amber-900/60 bg-amber-950/20 rounded-lg text-xs text-amber-400">
                You don't belong to any teams yet. First, you need to
                <router-link to="/teams/create" class="underline font-bold hover:text-amber-300">create one</router-link> 
                or wait to be accepted into an existing team.
              </div>

              <select 
                v-else 
                v-model="selectedTeamId" 
                class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer"
              >
                <option v-for="team in myTeams" :key="team.id" :value="team.id">
                  {{ team.name }} (Status: {{ team.status }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">Project Name / Specifications *</label>
              <input v-model="projectTitle" type="text" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm" />
            </div>

            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">Solution Outline *</label>
              <textarea v-model="proposedSolution" rows="5" placeholder="Describe your team’s vision for implementing the technical specifications and your architectural approach..." class="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white resize-none focus:border-blue-600 transition outline-none text-sm"></textarea>
            </div>
            
            <div class="flex gap-3 mt-2">
              <button @click="router.back()" class="w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium">Cancel</button>
              <button @click="nextStep" :disabled="myTeams.length === 0" class="flex-1 bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm">
                Next: Documentation
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="step === 2">
          <h2 class="text-2xl font-bold text-white mb-1">Required Documentation</h2>
          <p class="text-xs text-slate-500 mb-6">Step 2 of 2: Uploading accompanying PDF files specified by the call</p>
          
          <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/60 p-3 rounded-xl border border-red-900/50">{{ error }}</p>

          <div class="flex flex-col gap-4">
            <div v-for="(label, key) in docLabels" :key="key" class="border border-slate-950 p-4 rounded-xl bg-slate-950/60">
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ label }} *</label>
              <input type="file" accept=".pdf" @change="onFileChange(String(key), $event)" class="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-950 file:text-blue-400 hover:file:bg-blue-900 file:cursor-pointer transition" />
              <p v-if="files[key]" class="text-xs text-green-400 mt-2 font-medium">✓ Selected: {{ files[key]?.name }}</p>
            </div>

            <div class="flex gap-4 mt-4">
              <button @click="step = 1" class="w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium">Back</button>
              <button @click="submit" :disabled="loading" class="flex-1 bg-blue-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm shadow-lg shadow-blue-950">
                Submit Final Application
              </button>
            </div>
          </div>
        </div>

        <div v-if="step === 3" class="text-center py-6">
          <div class="text-5xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-white mb-2">Application Successfully Submitted!</h2>
          <p class="text-gray-400 text-sm mb-6 max-w-sm mx-auto">Your team proposal has been registered. You can track its assessment status inside your student account management panel.</p>
          <button @click="router.push('/programs/b')" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition">Back to Catalog</button>
        </div>
      </div>

    </div>
  </div>
</template>