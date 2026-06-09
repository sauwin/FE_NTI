<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/features/auth/stores/auth'
import { createApplicationWithDocuments } from '@/features/applications/api/applications'
import { getCallById } from '@/shared/api/calls'
import type { CallShortInfo, DocumentRequirement } from '@/shared/types/calls'
import { getTeams } from '@/features/student/api/teams'
import type { Team } from '@/features/student/types/teams'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const urlId = computed<number | null>(() => {
  const idParam = route.params.callId || route.params.id || route.query.id
  return idParam ? Number(idParam) : null
})

const resolvedCallId = ref<number | null>(null)
const currentCall = ref<CallShortInfo | null>(null)
const requiredDocuments = ref<DocumentRequirement[]>([])
const myTeams = ref<Team[]>([])
const selectedTeamId = ref<number | null>(null)
const applicantType = ref<'student' | 'team'>('team')

const error = ref<string>('')
const fieldErrors = ref<Record<string, string[]>>({})
const loading = ref<boolean>(false)
const step = ref<number>(1)

const projectTitle = ref<string>('')
const proposedSolution = ref<string>('')
const academicDeclaration = ref<boolean>(false)

const files = ref<Record<string, File | null>>({})

// Bind fallback labels directly to localization keys
const defaultDocLabels = computed<Record<string, string>>(() => ({
  cv: t('programB.upload.defaultLabels.cv'),
  motivation_letter: t('programB.upload.defaultLabels.motivation_letter'),
  technical_proposal: t('programB.upload.defaultLabels.technical_proposal'),
}))

function documentKey(doc: string | DocumentRequirement): string {
  const raw = typeof doc === 'string' ? doc : doc.type || doc.document_name || ''
  return String(raw).toLowerCase().replace(/\s+/g, '_')
}

function normalizeRequiredDocuments(raw: any): DocumentRequirement[] {
  if (!raw) {
    return []
  }

  const docs = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!Array.isArray(docs)) {
    return []
  }

  return docs.map((item: any) => {
    if (!item) {
      return {
        document_name: t('programB.upload.defaultLabels.genericDoc', { key: 'document' }),
        is_mandatory: true,
        max_size_mb: 10,
        type: 'document',
      }
    }

    if (typeof item === 'string') {
      return {
        document_name: item.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase()),
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

function getDocumentRequirements(): DocumentRequirement[] {
  if (requiredDocuments.value.length > 0) {
    return requiredDocuments.value
  }

  return Object.keys(docLabels.value).map((key) => ({
    document_name: docLabels.value[key] ?? 'undefined_document',
    type: key,
    is_mandatory: true,
    max_size_mb: 10,
  }))
}

const docLabels = computed<Record<string, string>>(() => {
  if (requiredDocuments.value.length > 0) {
    return requiredDocuments.value.reduce((labels: Record<string, string>, doc: DocumentRequirement) => {
      labels[documentKey(doc)] = doc.document_name || defaultDocLabels.value[documentKey(doc)] || t('programB.upload.defaultLabels.fallbackDoc', { key: documentKey(doc) })
      return labels
    }, {})
  }

  return defaultDocLabels.value
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
    error.value = t('programB.upload.errors.criticalUrlError')
    return
  }

  loading.value = true

  try {
    const teamsRes = await getTeams()
    myTeams.value = Array.isArray(teamsRes.data) ? teamsRes.data : []
    if (myTeams.value[0]) {
      selectedTeamId.value = myTeams.value[0].id
    }
  } catch (err) {
    console.error('Unable to load student teams:', err)
  }

  try {
    const callRes = await getCallById(urlId.value)
    currentCall.value = callRes.data
    resolvedCallId.value = callRes.data.id
    requiredDocuments.value = normalizeRequiredDocuments(callRes.data.required_documents)

    if (requiredDocuments.value.length === 0 && callRes.data.required_documents) {
      console.warn('Program B call returned required_documents but normalization failed:', callRes.data.required_documents)
    }

    if (callRes.data && callRes.data.task) {
      projectTitle.value = callRes.data.task.title || ''
    }
  } catch (err: any) {
    console.error('Error loading call details:', err)
    error.value = t('programB.upload.errors.loadDetailsError')
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
  if (applicantType.value == 'team' && !selectedTeamId.value) { error.value = t('programB.upload.errors.selectTeam'); return }
  if (!projectTitle.value.trim()) { error.value = t('programB.upload.errors.projectName'); return }
  if (!proposedSolution.value.trim()) { error.value = t('programB.upload.errors.solutionConcept'); return }
  if (!academicDeclaration.value) { error.value = t('programB.upload.errors.confirmDeclaration'); return }
  step.value = 2
}

async function submit(): Promise<void> {
  if (!resolvedCallId.value) { error.value = t('programB.upload.errors.noCallId'); return }
  error.value = ''
  fieldErrors.value = {}
  loading.value = true

  const requiredDocs = getDocumentRequirements()

  for (const doc of requiredDocs) {
    const key = documentKey(doc)
    if (doc.is_mandatory && !files.value[key]) {
      error.value = t('programB.upload.errors.missingDoc', { name: doc.document_name })
      loading.value = false
      return
    }
  }

  try {
    const payload = {
      applicant_type: applicantType.value,
      program_type: 'b' as const,
      call_id: resolvedCallId.value,
      team_id: applicantType.value == 'team' ? selectedTeamId.value : null,
      project_title: projectTitle.value,
      proposed_solution: proposedSolution.value,
      academic_declaration: academicDeclaration.value ? 1 : 0,
    }

    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value))
      }
    })

    requiredDocs.forEach((doc, index) => {
      const key = documentKey(doc)
      const file = files.value[key]
      if (!file) {
        return
      }

      formData.append(`documents[${index}][type]`, doc.type || key)
      formData.append(`documents[${index}][classification]`, 'confidential')
      formData.append(`documents[${index}][file]`, file)
    })

    await createApplicationWithDocuments(formData)

    step.value = 3
  } catch (e: any) {
    fieldErrors.value = e.response?.data?.errors ?? {}
    error.value = e?.response?.data?.message || t('programB.upload.errors.genericError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col justify-center items-center min-h-screen py-10 px-4 bg-slate-950 text-gray-300">

    <div class="w-full max-w-xl bg-slate-900/40 p-8 border border-slate-900 rounded-2xl relative overflow-hidden backdrop-blur-md">
      
      <div v-if="loading" class="text-center py-10 text-sm text-slate-400">
        {{ t('programB.upload.submittingApp') }}
      </div>

      <div v-else>
        <div v-if="currentCall?.task && step !== 3" class="mb-6 p-4 bg-blue-950/40 border border-blue-900/60 rounded-xl">
          <span class="text-[10px] uppercase font-bold tracking-wider text-blue-400 block mb-1">{{ t('programB.upload.applyingFor') }}</span>
          <h4 class="text-base font-bold text-white leading-tight">{{ currentCall.task.title }}</h4>
          <p class="text-xs text-slate-400 mt-1">{{ t('programB.upload.partner') }}: {{ currentCall.task.organization?.name || 'Program partner' }}</p>
        </div>

        <div v-if="step === 1">
          <h2 class="text-2xl font-bold text-white mb-1">{{ t('programB.upload.step1Title') }}</h2>
          <p class="text-xs text-slate-500 mb-6">{{ t('programB.upload.step1Sub') }}</p>
          
          <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/60 p-3 rounded-xl border border-red-900/50">{{ error }}</p>
          
          <div class="flex flex-col gap-5">
            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">{{ t('programB.upload.form.applicantType') }}</label>
              
              <select 
                v-model="applicantType" 
                class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer"
              >
                <option key="student" value="student">
                  Student
                </option>
                <option key="team" value="team">
                  Team
                </option>
              </select>
            </div>

            <div v-show="applicantType == 'team'">
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">{{ t('programB.upload.form.chooseTeam') }}</label>
              
              <div v-if="myTeams.length === 0" class="p-3 border border-dashed border-amber-900/60 bg-amber-950/20 rounded-lg text-xs text-amber-400">
                <i18n-t keypath="programB.upload.form.noTeamsWarning" scope="global">
                  <template #link>
                    <router-link to="/teams/create" class="underline font-bold hover:text-amber-300">
                      {{ t('programB.upload.form.createOne') }}
                    </router-link>
                  </template>
                </i18n-t>
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
              <p v-if="fieldErrors.team_id?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.team_id[0] }}</p>
            </div>

            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">{{ t('programB.upload.form.projectNameLabel') }}</label>
              <input v-model="projectTitle" type="text" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm" />
              <p v-if="fieldErrors.project_title?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.project_title[0] }}</p>
            </div>

            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">{{ t('programB.upload.form.solutionOutlineLabel') }}</label>
              <textarea v-model="proposedSolution" rows="5" :placeholder="t('programB.upload.form.solutionPlaceholder')" class="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-white resize-none focus:border-blue-600 transition outline-none text-sm"></textarea>
              <p v-if="fieldErrors.proposed_solution?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.proposed_solution[0] }}</p>
            </div>

            <div class="p-4 bg-blue-950/20 border border-blue-900/50 rounded-xl mt-2">
              <label class="flex items-start gap-3 cursor-pointer select-none">
                <input v-model="academicDeclaration" type="checkbox" class="mt-1 accent-blue-500 rounded" />
                <span class="text-xs text-gray-400 leading-normal">
                  {{ t('programB.upload.form.declaration') }}
                </span>
              </label>
            </div>
            
            <div class="flex gap-3 mt-2">
              <button @click="router.back()" class="w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium">{{ t('programB.upload.form.cancel') }}</button>
              <button @click="nextStep" :disabled="applicantType == 'team' && myTeams.length === 0" class="flex-1 bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm">
                {{ t('programB.upload.form.nextDoc') }}
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="step === 2">
          <h2 class="text-2xl font-bold text-white mb-1">{{ t('programB.upload.step2Title') }}</h2>
          <p class="text-xs text-slate-500 mb-6">{{ t('programB.upload.step2Sub') }}</p>
          
          <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/60 p-3 rounded-xl border border-red-900/50">{{ error }}</p>

          <div class="flex flex-col gap-4">
            <div v-for="(label, key) in docLabels" :key="key" class="border border-slate-950 p-4 rounded-xl bg-slate-950/60">
              <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ label }} *</label>
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" @change="onFileChange(String(key), $event)" class="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-950 file:text-blue-400 hover:file:bg-blue-900 file:cursor-pointer transition" />
              <p v-if="files[key]" class="text-xs text-green-400 mt-2 font-medium">
                {{ t('programB.upload.form.selectedFile', { name: files[key]?.name }) }}
              </p>
            </div>

            <div class="flex gap-4 mt-4">
              <button @click="step = 1" class="w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium">
                {{ t('programB.upload.form.back') }}
              </button>
              <button @click="submit" :disabled="loading" class="flex-1 bg-blue-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm shadow-lg shadow-blue-950">
                {{ t('programB.upload.form.submitFinal') }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="step === 3" class="text-center py-6">
          <div class="text-5xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold text-white mb-2">{{ t('programB.upload.successTitle') }}</h2>
          <p class="text-gray-400 text-sm mb-6 max-w-sm mx-auto">{{ t('programB.upload.successSub') }}</p>
          <button @click="router.push('/programs/b')" class="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            {{ t('programB.upload.backCatalog') }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>