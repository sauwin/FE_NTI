<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import { useI18n } from 'vue-i18n'
import {
  getApplicationById,
  getApplicationDocuments,
  updateApplication,
} from '@/features/applications/api/applications'
import type { ApplicationData, ExistingDocument } from '@/features/applications/types/applications'
import { getCallById } from '@/shared/api/calls'
import type { CallShortInfo, DocumentRequirement } from '@/shared/types/calls'
import { uploadDocument } from '@/shared/api/documents'
import { getTeams } from '@/features/student/api/teams'
import type { Team } from '@/features/student/types/teams'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const props = defineProps<{
  id: string
}>()
const applicationId = props.id

const loading = ref<boolean>(true)
const error = ref<string>('')
const step = ref<number>(1)

const programType = ref<string>('')
const applicantType = ref<'student' | 'team'>('team')
const currentCall = ref<CallShortInfo | null>(null)
const requiredDocuments = ref<DocumentRequirement[]>([])

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

// Base fallback labels mirrored directly from creation config
const defaultDocLabels = computed<Record<string, string>>(() => ({
  executive_summary: 'Executive Summary',
  technical_architecture: 'Technical Architecture',
  roadmap: 'Project Roadmap',
  budget: 'Project Budget',
  risk_analysis: 'Risk Analysis',
  monetization_model: 'Monetization Model',
  cv: t('programB.upload.defaultLabels.cv', 'CV (All team members in a single PDF file)'),
  motivation_letter: t('programB.upload.defaultLabels.motivation_letter', 'Motivation Letter'),
  technical_proposal: t('programB.upload.defaultLabels.technical_proposal', 'Technical Proposal'),
}))

// Standardized safe slug normalizer matching the Program B form mechanism
function documentKey(doc: string | DocumentRequirement): string {
  const raw = typeof doc === 'string' ? doc : doc.type || doc.document_name || ''
  return String(raw).toLowerCase().replace(/\s+/g, '_')
}

// Normalizes arbitrary/custom JSON backend schemas into uniform DocumentRequirement definitions
function normalizeRequiredDocuments(raw: any): DocumentRequirement[] {
  if (!raw) return []

  const docs = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!Array.isArray(docs)) return []

  return docs.map((item: any) => {
    if (!item) {
      return {
        document_name: 'Document Requirement',
        is_mandatory: true,
        max_size_mb: 10,
        type: 'document',
      }
    }

    if (typeof item === 'string') {
      return {
        document_name: item.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
        is_mandatory: true,
        max_size_mb: 10,
        type: documentKey(item),
      }
    }

    const name = item.document_name || item.name || item.label || String(item.type || item.slug || item.key || 'document')
    const key = String(item.type || item.slug || item.key || item.document_name || item.name || name)

    return {
      document_name: name,
      is_mandatory: item.is_mandatory ?? true,
      max_size_mb: item.max_size_mb ?? 10,
      type: documentKey(key),
    }
  })
}

// Computes structural labels matching runtime fields
const docLabels = computed<Record<string, string>>(() => {
  if (requiredDocuments.value.length > 0) {
    return requiredDocuments.value.reduce((labels: Record<string, string>, doc: DocumentRequirement) => {
      const key = documentKey(doc)
      labels[key] = doc.document_name || defaultDocLabels.value[key] || `Document (${key})`
      return labels
    }, {})
  }

  return defaultDocLabels.value
})

// Ensures reactive local file map keys synchronize smoothly with computed labels
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

  try {
    const [appRes, teamsRes] = await Promise.all([
      getApplicationById(applicationId),
      getTeams(),
    ])

    const appData = appRes.data as ApplicationData
    
    programType.value = appData.program_type
    applicantType.value = appData.applicant_type || (appData.team_id ? 'team' : 'student')
    myTeams.value = Array.isArray(teamsRes.data) ? teamsRes.data : []

    selectedTeamId.value = appData.team_id || (myTeams.value[0]?.id ?? null)
    category.value = appData.category || ''
    academicDeclaration.value = !!appData.academic_declaration
    projectTitle.value = appData.project_title || ''
    proposedSolution.value = appData.proposed_solution || ''

    const [callRes, docsRes] = await Promise.all([
      getCallById(appData.call_id),
      getApplicationDocuments(applicationId),
    ])

    currentCall.value = callRes.data
    
    // Dynamic generation from Creation parsing scheme
    requiredDocuments.value = normalizeRequiredDocuments(callRes.data?.required_documents)
    existingDocs.value = Array.isArray(docsRes.data) ? docsRes.data : []

    // Fallback: Populate title using task descriptor if left empty on Program B calls
    if (programType.value === 'b' && !projectTitle.value && callRes.data?.task) {
      projectTitle.value = callRes.data.task.title || ''
    }

  } catch (err: any) {
    console.error('Failed to load lifecycle application context:', err)
    error.value = t('applications.edit.load_error')
  } finally {
    loading.value = false
  }
})

// Custom helper method matching dynamic fields securely with currently fetched list parameters
function resolveExistingFile(systemKey: string): ExistingDocument | undefined {
  return existingDocs.value.find(d => {
    const backendType = String(d.type || '').toLowerCase().replace(/\s+/g, '_')
    return backendType === systemKey
  })
}

function onFileChange(key: string, event: Event): void {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    files.value[key] = input.files[0]
  }
}

function nextStep(): void {
  error.value = ''
  if (programType.value === 'a') {
    if (!selectedTeamId.value) { error.value = t('applications.edit.validation.team'); return }
    if (!category.value) { error.value = t('applications.edit.validation.category'); return }
    if (!academicDeclaration.value) { error.value = t('applications.edit.validation.academic'); return }
  } else {
    if (applicantType.value === 'team' && !selectedTeamId.value) { error.value = t('applications.edit.validation.team'); return }
    if (!projectTitle.value.trim()) { error.value = t('applications.edit.validation.title'); return }
    if (!proposedSolution.value.trim()) { error.value = t('applications.edit.validation.solution'); return }
  }
  step.value = 2
}

async function submit(): Promise<void> {
  error.value = ''
  loading.value = true

  try {
    const payload: Record<string, any> = {
      program_type: programType.value,
      applicant_type: programType.value === 'a' ? 'team' : applicantType.value
    }

    if (programType.value === 'a') {
      payload.team_id = selectedTeamId.value
      payload.category = category.value
      payload.academic_declaration = academicDeclaration.value ? 1 : 0
    } else {
      payload.team_id = applicantType.value === 'team' ? selectedTeamId.value : null
      payload.project_title = projectTitle.value
      payload.proposed_solution = proposedSolution.value
    }

    await updateApplication(applicationId, payload)

    // Process attachments sequentially using modern mapped keys
    for (const [type, file] of Object.entries(files.value)) {
      if (!file) continue
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('classification', 'confidential')
      formData.append('application_id', String(applicationId))

      await uploadDocument(formData)
    }

    router.push(`/applications/${applicationId}`)
  } catch (err: any) {
    error.value = err?.response?.data?.message || t('applications.edit.general_error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col justify-center items-center min-h-screen py-10 px-4 bg-slate-950 text-gray-300">
    <div class="w-full max-w-xl bg-slate-900/40 p-8 border border-slate-900 rounded-2xl relative backdrop-blur-md">
      
      <div v-if="loading" class="text-center py-10 text-sm text-slate-400">
        {{ t('applications.edit.loading_params') }}
      </div>

      <div v-else>
        <div class="mb-6">
          <span class="text-[10px] uppercase font-bold tracking-wider text-blue-400 block mb-1">
            {{ t('applications.edit.mode_title', { id: applicationId }) }}
          </span>
          <h2 class="text-2xl font-bold text-white">
            {{ t('applications.edit.setup_title', { type: programType === 'a' ? t('applications.edit.program_a') : t('applications.edit.program_b') }) }}
          </h2>
          <p class="text-xs text-slate-500 mt-1">
            {{ t('applications.edit.step_status', { current: step, total: 2 }) }}
          </p>
        </div>

        <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/60 p-3 rounded-xl border border-red-900/50">{{ error }}</p>

        <div v-if="step === 1" class="flex flex-col gap-5">
          
          <div v-if="programType === 'b'">
            <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">
              {{ t('programB.upload.form.applicantType', 'Applicant Type') }}
            </label>
            <select 
              v-model="applicantType" 
              class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer"
            >
              <option value="student">Student (Individual)</option>
              <option value="team">Team</option>
            </select>
          </div>

          <div v-show="programType === 'a' || applicantType === 'team'">
            <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">{{ t('applications.edit.assigned_team') }}</label>
            
            <div v-if="myTeams.length === 0" class="p-3 border border-dashed border-amber-900/60 bg-amber-950/20 rounded-lg text-xs text-amber-400 mb-2">
              {{ t('programB.upload.form.noTeamsWarning', 'You have no teams created.') }}
            </div>

            <select v-else v-model="selectedTeamId" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer">
              <option v-for="team in myTeams" :key="team.id" :value="team.id">
                {{ team.name }} (Status: {{ team.status }})
              </option>
            </select>
          </div>

          <template v-if="programType === 'a'">
            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">{{ t('applications.edit.incubation_track') }}</label>
              <select v-model="category" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer">
                <option value="" disabled>{{ t('applications.edit.select_track') }}</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="p-4 bg-blue-950/20 border border-blue-900/50 rounded-xl mt-2">
              <label class="flex items-start gap-3 cursor-pointer select-none">
                <input v-model="academicDeclaration" type="checkbox" class="mt-1 accent-blue-500 rounded" />
                <span class="text-xs text-gray-400 leading-normal">
                  {{ t('applications.edit.academic_declaration') }}
                </span>
              </label>
            </div>
          </template>

          <template v-else>
            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">{{ t('applications.edit.project_name') }}</label>
              <input v-model="projectTitle" type="text" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm" />
            </div>

            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">{{ t('applications.edit.solution_outline') }}</label>
              <textarea v-model="proposedSolution" rows="5" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white resize-none focus:border-blue-600 transition outline-none text-sm"></textarea>
            </div>
          </template>

          <div class="flex gap-3 mt-2">
            <button @click="router.push('/dashboard')" class="w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium">
              {{ t('applications.edit.btn_cancel') }}
            </button>
            <button @click="nextStep" :disabled="applicantType === 'team' && myTeams.length === 0" class="flex-1 bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm">
              {{ t('applications.edit.btn_next') }}
            </button>
          </div>
        </div>

        <div v-else-if="step === 2" class="flex flex-col gap-4">
          <div class="p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-400 leading-relaxed">
            {{ t('applications.edit.doc_instructions') }}
          </div>

          <div v-for="(label, key) in docLabels" :key="key" class="border border-slate-950 p-4 rounded-xl bg-slate-950/60">
            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{{ label }}</label>
            
            <div class="text-[11px] text-blue-400 mb-2 flex items-center gap-1.5 font-medium">
              <span>{{ t('applications.edit.current_file') }}</span>
              <span class="underline italic">
                {{ resolveExistingFile(String(key))?.file_name || t('applications.edit.not_uploaded') }}
              </span>
            </div>

            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" @change="onFileChange(String(key), $event)" class="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-950 file:text-blue-400 hover:file:bg-blue-900 file:cursor-pointer transition" />
            <p v-if="files[key]" class="text-xs text-green-400 mt-2 font-medium">
              {{ t('applications.edit.selected_replace', { name: files[key]?.name }) }}
            </p>
          </div>

          <div class="flex gap-4 mt-4">
            <button @click="step = 1" class="w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium">
              {{ t('applications.edit.btn_back') }}
            </button>
            <button @click="submit" :disabled="loading" class="flex-1 bg-blue-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm shadow-lg shadow-blue-950">
              {{ loading ? t('applications.edit.saving') : t('applications.edit.btn_save') }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>