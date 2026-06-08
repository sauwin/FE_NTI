<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getTeams } from '@/features/student/api/teams'
import { useAuthStore } from '@/features/auth/stores/auth'
import { getActiveCall, createApplicationWithDocuments } from '@/features/applications/api/applications'
import type { DocumentRequirement } from '@/shared/types/calls'

const { t } = useI18n()
const router = useRouter()
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const loading = ref(false)
const step = ref(1)
const auth = useAuthStore()
const callId = ref<number | null>(null)

const myTeams = ref<any[]>([])            
const selectedTeamId = ref<number | null>(null) 
const loadingTeams = ref(false)

const category = ref('')
const academicDeclaration = ref(false)

const requiredDocuments = ref<DocumentRequirement[]>([])
const files = ref<Record<string, File | null>>({})

const categories = [
  { key: 'Software Development', labelKey: 'programA.upload.categories.softwareDevelopment' },
  { key: 'AI & Data Technologies', labelKey: 'programA.upload.categories.aiDataTechnologies' },
  { key: 'Web Applications', labelKey: 'programA.upload.categories.webApplications' },
  { key: 'Game Development', labelKey: 'programA.upload.categories.gameDevelopment' },
  { key: 'IoT & Embedded Systems', labelKey: 'programA.upload.categories.iotEmbeddedSystems' },
]

function docKey(input: string | DocumentRequirement): string {
  const name = typeof input === 'string' ? input : (input.type || input.document_name)
  return name.toLowerCase().replace(/\s+/g, '_')
}

function onFileChange(key: string, event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    files.value[key] = input.files[0]
  }
}

async function fetchUserTeams() {
  loadingTeams.value = true
  try {
    const res = await getTeams()
    const currentUserId = auth.user?.id
    
    myTeams.value = res.data.filter((team: any) => {
      const acceptedCount = team.members?.filter((m: any) => m.pivot?.status === 'accepted').length ?? 0
      return team.leader_id === currentUserId && acceptedCount >= 3
    })
  } catch (e) {
    console.error('Failed to load user teams', e)
  } finally {
    loadingTeams.value = false
  }
}

onMounted(async () => {
  if (!auth.isLoggedIn) {
    router.push('/auth/login')
    return
  }

  loading.value = true
  
  await fetchUserTeams()

  try {
    const res = await getActiveCall('a')
    callId.value = res.data.id
    
    const docs = res.data.required_documents ?? []
    if (Array.isArray(docs) && docs.length > 0) {
      requiredDocuments.value = docs.map((doc: any) => {
        if (typeof doc === 'string') {
          return {
            document_name: doc.replace(/_/g, ' ').toUpperCase(),
            is_mandatory: true,
            max_size_mb: 10
          }
        }
        return doc
      })

      requiredDocuments.value.forEach(doc => { 
        files.value[docKey(doc)] = null 
      })
    } else {
      error.value = t('programA.upload.errors.noDocsConfigured')
    }
  } catch (e) {
    error.value = t('programA.upload.errors.noActiveCall')
  } finally {
    loading.value = false
  }
})

function nextStep() {
  error.value = ''
  if (!selectedTeamId.value) {
    error.value = t('programA.upload.errors.selectTeam')
    return
  }
  if (!category.value) {
    error.value = t('programA.upload.errors.selectCategory')
    return
  }
  if (!academicDeclaration.value) {
    error.value = t('programA.upload.errors.confirmDeclaration')
    return
  }
  step.value = 2
}

async function submit(mode: 'draft' | 'final' = 'final') {
  if (!callId.value) { error.value = t('programA.upload.errors.noActiveCall'); return }
  error.value = ''
  loading.value = true

  try {
    const payload = {
      applicant_type: 'team' as const,
      program_type: 'a' as const,
      team_id: selectedTeamId.value,
      category: category.value,
      submit_type: mode,
      academic_declaration: academicDeclaration.value ? 1 : 0,
    }

    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value))
      }
    })

    requiredDocuments.value.forEach((doc, index) => {
      const key = docKey(doc)
      const file = files.value[key]

      if (mode === 'final' && !file && doc.is_mandatory) {
        error.value = t('programA.upload.errors.missingDoc', { name: doc.document_name })
      }

      if (!file) {
        return
      }

      formData.append(`documents[${index}][type]`, key)
      formData.append(`documents[${index}][classification]`, 'confidential')
      formData.append(`documents[${index}][file]`, file)
    })

    if (error.value) {
      loading.value = false
      return
    }

    await createApplicationWithDocuments(formData)

    if (mode === 'draft') {
      router.push('/dashboard')
    } else {
      step.value = 3
    }
  } catch (e: any) {
    fieldErrors.value = e.response?.data?.errors ?? {}
    error.value = e?.response?.data?.message || t('programA.upload.errors.genericError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col justify-center items-center min-h-screen py-10 px-4 bg-slate-950 text-gray-300">
    <div class="w-full max-w-xl bg-slate-900/40 p-8 border border-slate-900 rounded-2xl relative backdrop-blur-md">
      
      <div v-if="loading && step === 1 && myTeams.length === 0" class="text-center py-10 text-sm text-slate-400">
        {{ t('programA.upload.loadingParams') }}
      </div>

      <div v-else>
        <div class="mb-8">
          <span class="text-[10px] uppercase font-bold tracking-wider text-blue-400 block mb-1">
            {{ t('programA.upload.newApplication') }}
          </span>
          <h2 class="text-2xl font-bold text-white">
            {{ t('programA.upload.title') }}
          </h2>
          <p class="text-xs text-slate-500 mt-1">
            {{ t('programA.upload.stepIndicator', { step: step }) }}
          </p>
        </div>

        <div class="flex items-center mb-8" v-if="step < 3">
          <div class="flex flex-col items-center cursor-pointer" @click="step = 1">
            <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border transition',
              step >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">1</div>
            <span class="text-[10px] mt-1.5 font-medium" :class="step >= 1 ? 'text-blue-400' : 'text-gray-600'">
              {{ t('programA.upload.tabTeamInfo') }}
            </span>
          </div>
          <div class="flex-1 h-px mx-4 mb-4 transition-colors duration-300" :class="step >= 2 ? 'bg-blue-600' : 'bg-blue-900'"></div>
          <div class="flex flex-col items-center">
            <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border transition',
              step >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">2</div>
            <span class="text-[10px] mt-1.5 font-medium" :class="step >= 2 ? 'text-blue-400' : 'text-gray-600'">
              {{ t('programA.upload.tabDocuments') }}
            </span>
          </div>
        </div>

        <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/60 p-3 rounded-xl border border-red-900/50">{{ error }}</p>

        <form @submit.prevent="submit('final')" class="space-y-5">
          
          <template v-if="step === 1">
            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">
                {{ t('programA.upload.form.selectTeamLabel') }}
              </label>
              <select v-model="selectedTeamId" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer">
                <option value="" disabled selected>
                  {{ t('programA.upload.form.chooseTeamPlaceholder') }}
                </option>
                <option v-for="team in myTeams" :key="team.id" :value="team.id">
                  {{ team.name }}
                </option>
              </select>
              <p v-if="fieldErrors.team_id?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.team_id[0] }}</p>
              <p v-if="myTeams.length === 0 && !loadingTeams" class="text-[11px] text-amber-500 mt-1.5 leading-normal">
                {{ t('programA.upload.form.noTeamsWarning') }}
              </p>
            </div>

            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">
                {{ t('programA.upload.form.focusCategoryLabel') }}
              </label>
              <select v-model="category" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer">
                <option value="" disabled selected>
                  {{ t('programA.upload.form.selectCategoryPlaceholder') }}
                </option>
                <option v-for="cat in categories" :key="cat.key" :value="cat.key">
                  {{ t(cat.labelKey) }}
                </option>
              </select>
              <p v-if="fieldErrors.category?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.category[0] }}</p>
            </div>

            <div class="p-4 bg-blue-950/20 border border-blue-900/50 rounded-xl mt-2">
              <label class="flex items-start gap-3 cursor-pointer select-none">
                <input v-model="academicDeclaration" type="checkbox" class="mt-1 accent-blue-500 rounded" />
                <span class="text-xs text-gray-400 leading-normal">
                  {{ t('programA.upload.form.declaration') }}
                </span>
              </label>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="router.back()" class="w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium">
                {{ t('programA.upload.form.cancel') }}
              </button>
              <button type="button" @click="nextStep" class="flex-1 bg-blue-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm">
                {{ t('programA.upload.form.continue') }}
              </button>
            </div>
          </template>

          <template v-if="step === 2">
            {{ console.log(requiredDocuments) }}
            <div class="space-y-4">
              <div v-for="doc in requiredDocuments" :key="doc.document_name" class="border border-slate-950 p-4 rounded-xl bg-slate-950/60">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {{ doc.document_name }} <span v-if="doc.is_mandatory" class="text-red-500">*</span>
                </label>
                
                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" class="hidden" :id="`file-${docKey(doc.document_name)}`" @change="onFileChange(docKey(doc.document_name), $event)" />
                
                <label :for="`file-${docKey(doc.document_name)}`" class="flex items-center justify-between bg-blue-600/5 border border-blue-900/50 hover:border-blue-600 rounded-xl px-4 h-11 cursor-pointer transition-colors">
                  <span class="text-sm truncate pr-2" :class="files[docKey(doc.document_name)] ? 'text-white' : 'text-gray-600'">
                    {{ files[docKey(doc.document_name)]?.name ?? t('programA.upload.form.chooseFile') }}
                  </span>
                  <span class="text-xs text-blue-400 shrink-0">
                    {{ t('programA.upload.form.browse') }}
                  </span>
                </label>
              </div>
            </div>

            <div class="flex flex-wrap gap-3 mt-2">
              <button type="button" @click="step = 1" class="border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white w-full sm:w-1/4 h-10 rounded-md text-sm cursor-pointer transition-colors">
                {{ t('programA.upload.form.back') }}
              </button>
              
              <button type="button" @click="submit('draft')" :disabled="loading || requiredDocuments.length === 0" class="border border-blue-600 text-blue-400 hover:bg-blue-600/10 disabled:opacity-50 cursor-pointer flex-1 h-10 rounded-md text-sm font-medium transition-colors">
                {{ loading ? t('programA.upload.form.saving') : t('programA.upload.form.saveDraft') }}
              </button>

              <button type="submit" :disabled="loading || requiredDocuments.length === 0" class="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer flex-1 h-10 rounded-md text-sm font-medium transition-colors">
                {{ loading ? t('programA.upload.form.submitting') : t('programA.upload.form.submitFinal') }}
              </button>
            </div>
          </template>

          <template v-if="step === 3">
            <div class="text-center py-6">
              <div class="text-5xl mb-4">🎉</div>
              <h2 class="text-2xl font-bold text-white mb-2">
                {{ t('programA.upload.success.title') }}
              </h2>
              <p class="text-gray-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                {{ t('programA.upload.success.description') }}
              </p>
              <button type="button" @click="router.push('/dashboard')" class="bg-blue-600 hover:bg-blue-700 text-white px-6 h-10 rounded-lg text-sm font-medium transition-colors">
                {{ t('programA.upload.success.goDashboard') }}
              </button>
            </div>
          </template>

        </form>
      </div>

    </div>
  </div>
</template>