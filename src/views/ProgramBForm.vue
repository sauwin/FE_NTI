<script setup lang="ts">
import { watch, ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api/axios'
import { useAuthStore } from '../stores/auth'

// Інтерфейс для збереження структури чернетки
interface DraftData {
  teamName: string
  teamDescription: string
  projectTitle: string
  proposedSolution: string
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const callId = ref<number | null>(
  route.query.call_organization_id ? Number(route.query.call_organization_id) :
  route.params.callOrganizationId ? Number(route.params.callOrganizationId) :
  route.params.callId ? Number(route.params.callId) :
  null
)
const editId = ref<number | null>(route.query.edit ? Number(route.query.edit) : null)
const isEditMode = computed<boolean>(() => !!editId.value)

const error = ref<string>('')
const loading = ref<boolean>(false)
const step = ref<number>(1)

const DRAFT_KEY = 'draft_program_b'

// Реактивні текстові змінні
const teamName = ref<string>('')
const teamDescription = ref<string>('')
const projectTitle = ref<string>('')
const proposedSolution = ref<string>('')

// Сувора типізація сховища файлів
const files = ref<Record<string, File | null>>({
  cv: null,
  motivation_letter: null,
  technical_proposal: null,
})

const docLabels: Record<string, string> = {
  cv: 'CV (all team members, merged into one file)',
  motivation_letter: 'Motivation Letter',
  technical_proposal: 'Technical Proposal / Solution Design',
}

// Сувора типізація дженерик-функції Debounce в TypeScript
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>): void => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const saveDraftToServer = debounce(async (data: DraftData) => {
  try {
    await api.post('/drafts', { program_type: 'b', data })
  } catch {}
}, 1500)

onMounted(async () => {
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }

  if (!callId.value && !isEditMode.value) {
    error.value = 'No challenge selected. Please choose a task from the catalog first.'
    return
  }

  try {
    // Спроба отримати чернетку з сервера
    const res = await api.get<{ data: Partial<DraftData> }>('/drafts/b')
    if (res.data?.data) {
      teamName.value = res.data.data.teamName ?? ''
      teamDescription.value = res.data.data.teamDescription ?? ''
      projectTitle.value = res.data.data.projectTitle ?? ''
      proposedSolution.value = res.data.data.proposedSolution ?? ''
    }
  } catch {
    // Якщо сервер лежить — беремо з localStorage
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      const draft = JSON.parse(saved) as Partial<DraftData>
      teamName.value = draft.teamName ?? ''
      teamDescription.value = draft.teamDescription ?? ''
      projectTitle.value = draft.projectTitle ?? ''
      proposedSolution.value = draft.proposedSolution ?? ''
    }
  }
})

// Слідкуємо за змінами для автозбереження чернетки
watch([teamName, teamDescription, projectTitle, proposedSolution], () => {
  const currentData: DraftData = {
    teamName: teamName.value,
    teamDescription: teamDescription.value,
    projectTitle: projectTitle.value,
    proposedSolution: proposedSolution.value,
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(currentData))
  saveDraftToServer(currentData)
})

// КРИТИЧНО ДЛЯ TS: Правильна типізація завантаження файлу через Input Event
function onFileChange(type: string, event: Event): void {
  const input = event.target as HTMLInputElement // Явне приведення типів
  if (input.files && input.files[0]) {
    files.value[type] = input.files[0]
  }
}

function nextStep(): void {
  error.value = ''
  if (!teamName.value.trim()) { error.value = 'Team name is required'; return }
  if (!projectTitle.value.trim()) { error.value = 'Project title is required'; return }
  if (!proposedSolution.value.trim()) { error.value = 'Please describe your solution'; return }
  step.value = 2
}

async function submit(): Promise<void> {
  if (!callId.value) { error.value = 'No challenge selected'; return }
  error.value = ''
  loading.value = true

  // Перевірка наявності всіх файлів
  for (const key of Object.keys(files.value)) {
    if (!files.value[key]) {
      error.value = `Please upload: ${docLabels[key]}`
      loading.value = false
      return
    }
  }

  try {
    let applicationId: number

    interface AppResponse {
      application_id: number
    }

    if (isEditMode.value) {
      await api.patch(`/applications/${editId.value}`, {
        applicant_type: 'team', 
        program_type: 'b',
        call_id: callId.value 
      })
      applicationId = editId.value!
    } else {
      const appRes = await api.post<AppResponse>('/applications', {
        applicant_type: 'team', 
        program_type: 'b',
        call_id: callId.value 
      })
      applicationId = appRes.data.application_id
    }

    const typeMap: Record<string, string> = {
      cv: 'cv',
      motivation_letter: 'motivation_letter',
      technical_proposal: 'other',
    }

    // Завантаження файлів через FormData
    for (const [type, file] of Object.entries(files.value)) {
      if (!file) continue
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', typeMap[type] ?? type)
      formData.append('classification', 'confidential')
      formData.append('application_id', String(applicationId))

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    localStorage.removeItem(DRAFT_KEY)
    await api.post('/drafts', { program_type: 'b', data: {} })
    step.value = 3

  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex justify-center items-center min-h-screen py-10">
    <div class="w-full max-w-xl bg-slate-950 p-8 border border-blue-900 rounded-2xl">
      
      <div v-if="step === 1">
        <h2 class="text-2xl font-bold text-white mb-4">Application details (Team)</h2>
        <p v-if="error" class="text-red-500 text-sm mb-4 bg-red-500/10 p-2 rounded border border-red-900">{{ error }}</p>
        
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-xs text-gray-400 font-semibold uppercase mb-1">Team Name *</label>
            <input v-model="teamName" type="text" class="w-full bg-blue-900/20 border border-blue-900 h-10 px-3 rounded text-white" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 font-semibold uppercase mb-1">Team Description (Optional)</label>
            <textarea v-model="teamDescription" rows="2" class="w-full bg-blue-900/20 border border-blue-900 p-3 rounded text-white resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs text-gray-400 font-semibold uppercase mb-1">Project Title *</label>
            <input v-model="projectTitle" type="text" class="w-full bg-blue-900/20 border border-blue-900 h-10 px-3 rounded text-white" />
          </div>
          <div>
            <label class="block text-xs text-gray-400 font-semibold uppercase mb-1">Proposed Solution Outline *</label>
            <textarea v-model="proposedSolution" rows="4" class="w-full bg-blue-900/20 border border-blue-900 p-3 rounded text-white resize-none"></textarea>
          </div>
          <button @click="nextStep" class="bg-blue-600 text-white h-11 rounded font-medium mt-2 hover:bg-blue-700 transition">Next: Upload Documents</button>
        </div>
      </div>

      <div v-else id="step === 2">
        <h2 class="text-2xl font-bold text-white mb-4">Required Documentation</h2>
        <p v-if="error" class="text-red-500 text-sm mb-4 bg-red-500/10 p-2 rounded border border-red-900">{{ error }}</p>

        <div class="flex flex-col gap-4">
          <div v-for="(label, key) in docLabels" :key="key" class="border border-slate-900 p-4 rounded bg-slate-900/40">
            <label class="block text-sm font-medium text-gray-300 mb-2">{{ label }} *</label>
            <input type="file" accept=".pdf,.doc,.docx" @change="onFileChange(key, $event)" class="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-900 file:text-blue-200 hover:file:bg-blue-800 file:cursor-pointer" />
            <p v-if="files[key]" class="text-xs text-green-400 mt-1">✓ Selected: {{ files[key]?.name }}</p>
          </div>

          <div class="flex gap-4 mt-2">
            <button @click="step = 1" class="w-1/3 border border-blue-900 text-gray-400 h-11 rounded hover:text-white transition">Back</button>
            <button @click="submit" :disabled="loading" class="flex-1 bg-blue-600 text-white h-11 rounded font-medium hover:bg-blue-700 transition">
              {{ loading ? 'Submitting...' : 'Submit Application' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="step === 3" class="text-center py-6">
        <div class="text-5xl mb-4 text-green-500">🎉</div>
        <h2 class="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
        <p class="text-gray-400 text-sm mb-6">Your team proposal has been registered successfully under call organization parameters.</p>
        <button @click="router.push('/programs/b')" class="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 transition">Back to Program B</button>
      </div>

    </div>
  </div>
</template>