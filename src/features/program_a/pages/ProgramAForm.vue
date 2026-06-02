<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTeams } from '@/features/student/api/teams'
import { useAuthStore } from '@/features/auth/stores/auth'
import { getActiveCall, createApplication } from '@/features/applications/api/applications'
import { uploadDocument } from '@/shared/api/documents'
import type { DocumentRequirement } from '@/shared/types/calls'

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
  'Software Development',
  'AI & Data Technologies',
  'Web Applications',
  'Game Development',
  'IoT & Embedded Systems',
]

function docKey(name: string): string {
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
        files.value[docKey(doc.document_name)] = null 
      })
    } else {
      error.value = 'Active call has no required documents configured.'
    }
  } catch (e) {
    error.value = 'No active call available.'
  } finally {
    loading.value = false
  }
})

function nextStep() {
  error.value = ''
  if (!selectedTeamId.value) {
    error.value = 'Please select a qualified team.'
    return
  }
  if (!category.value) {
    error.value = 'Please select a focus category.'
    return
  }
  if (!academicDeclaration.value) {
    error.value = 'You must confirm the academic status declaration.'
    return
  }
  step.value = 2
}

async function submit(mode: 'draft' | 'final' = 'final') {
  if (!callId.value) { error.value = 'No active call available'; return }
  error.value = ''
  loading.value = true

  try {
    const payload = {
      applicant_type: 'team' as const,
      program_type: 'a' as const,
      team_id: selectedTeamId.value,
      category: category.value,
      submit_type: mode
    }

    const appRes = await createApplication(payload)
    const applicationId = appRes.data.application_id

    for (const doc of requiredDocuments.value) {
      const key = docKey(doc.document_name)
      const file = files.value[key]

      if (mode === 'final' && !file && doc.is_mandatory) {
        error.value = `Missing required document: ${doc.document_name}`
        loading.value = false
        return
      }

      if (!file) continue

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', key)
      formData.append('classification', 'confidential')
      formData.append('application_id', String(applicationId))

      await uploadDocument(formData)
    }

    if (mode === 'draft') {
      router.push('/dashboard')
    } else {
      step.value = 3
    }
  } catch (e: any) {
    fieldErrors.value = e.response?.data?.errors ?? {}
    error.value = e?.response?.data?.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col justify-center items-center min-h-screen py-10 px-4 bg-slate-950 text-gray-300">
    <div class="w-full max-w-xl bg-slate-900/40 p-8 border border-slate-900 rounded-2xl relative backdrop-blur-md">
      
      <div v-if="loading && step === 1 && myTeams.length === 0" class="text-center py-10 text-sm text-slate-400">
        Loading program parameters...
      </div>

      <div v-else>
        <div class="mb-8">
          <span class="text-[10px] uppercase font-bold tracking-wider text-blue-400 block mb-1">New Application</span>
          <h2 class="text-2xl font-bold text-white">Program A: Incubation</h2>
          <p class="text-xs text-slate-500 mt-1">Step {{ step }} of 2: Team setup & verification</p>
        </div>

        <div class="flex items-center mb-8" v-if="step < 3">
          <div class="flex flex-col items-center cursor-pointer" @click="step = 1">
            <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border transition',
              step >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">1</div>
            <span class="text-[10px] mt-1.5 font-medium" :class="step >= 1 ? 'text-blue-400' : 'text-gray-600'">Team Info</span>
          </div>
          <div class="flex-1 h-px mx-4 mb-4 transition-colors duration-300" :class="step >= 2 ? 'bg-blue-600' : 'bg-blue-900'"></div>
          <div class="flex flex-col items-center">
            <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border transition',
              step >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">2</div>
            <span class="text-[10px] mt-1.5 font-medium" :class="step >= 2 ? 'text-blue-400' : 'text-gray-600'">Documents</span>
          </div>
        </div>

        <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/60 p-3 rounded-xl border border-red-900/50">{{ error }}</p>

        <form @submit.prevent="submit('final')" class="space-y-5">
          
          <template v-if="step === 1">
            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">Select Your Team *</label>
              <select v-model="selectedTeamId" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer">
                <option value="" disabled selected>Choose a team...</option>
                <option v-for="team in myTeams" :key="team.id" :value="team.id">
                  {{ team.name }}
                </option>
              </select>
              <p v-if="fieldErrors.team_id?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.team_id[0] }}</p>
              <p v-if="myTeams.length === 0 && !loadingTeams" class="text-[11px] text-amber-500 mt-1.5 leading-normal">
                ⚠️ No eligible teams found. You must be the team leader, and at least 3 members must have already accepted your invitation.
              </p>
            </div>

            <div>
              <label class="block text-xs text-gray-400 font-semibold uppercase mb-2">Focus Category *</label>
              <select v-model="category" class="w-full bg-slate-950 border border-slate-800 h-11 px-3 rounded-lg text-white focus:border-blue-600 transition outline-none text-sm cursor-pointer">
                <option value="" disabled selected>Select category...</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
              <p v-if="fieldErrors.category?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.category[0] }}</p>
            </div>

            <div class="p-4 bg-blue-950/20 border border-blue-900/50 rounded-xl mt-2">
              <label class="flex items-start gap-3 cursor-pointer select-none">
                <input v-model="academicDeclaration" type="checkbox" class="mt-1 accent-blue-500 rounded" />
                <span class="text-xs text-gray-400 leading-normal">
                  I declare that I have no carried-over courses and my average grade of core courses meets the required threshold. I understand this will be verified by the committee. *
                </span>
              </label>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="router.back()" class="w-1/3 border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white transition text-sm font-medium">Cancel</button>
              <button type="button" @click="nextStep" class="flex-1 bg-blue-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm">
                Continue to Documents →
              </button>
            </div>
          </template>

          <template v-if="step === 2">
            <div class="space-y-4">
              <div v-for="doc in requiredDocuments" :key="doc.document_name" class="border border-slate-950 p-4 rounded-xl bg-slate-950/60">
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {{ doc.document_name }} <span v-if="doc.is_mandatory" class="text-red-500">*</span>
                </label>
                
                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" class="hidden" :id="`file-${docKey(doc.document_name)}`" @change="onFileChange(docKey(doc.document_name), $event)" />
                
                <label :for="`file-${docKey(doc.document_name)}`" class="flex items-center justify-between bg-blue-600/5 border border-blue-900/50 hover:border-blue-600 rounded-xl px-4 h-11 cursor-pointer transition-colors">
                  <span class="text-sm truncate pr-2" :class="files[docKey(doc.document_name)] ? 'text-white' : 'text-gray-600'">
                    {{ files[docKey(doc.document_name)]?.name ?? 'Choose file...' }}
                  </span>
                  <span class="text-xs text-blue-400 shrink-0">Browse</span>
                </label>
              </div>
            </div>

            <div class="flex flex-wrap gap-3 mt-2">
              <button type="button" @click="step = 1" class="border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white w-full sm:w-1/4 h-10 rounded-md text-sm cursor-pointer transition-colors">
                ← Back
              </button>
              
              <button type="button" @click="submit('draft')" :disabled="loading || requiredDocuments.length === 0" class="border border-blue-600 text-blue-400 hover:bg-blue-600/10 disabled:opacity-50 cursor-pointer flex-1 h-10 rounded-md text-sm font-medium transition-colors">
                {{ loading ? 'Saving...' : 'Save Draft' }}
              </button>

              <button type="submit" :disabled="loading || requiredDocuments.length === 0" class="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer flex-1 h-10 rounded-md text-sm font-medium transition-colors">
                {{ loading ? 'Submitting...' : 'Submit Final' }}
              </button>
            </div>
          </template>

          <template v-if="step === 3">
            <div class="text-center py-6">
              <div class="text-5xl mb-4">🎉</div>
              <h2 class="text-2xl font-bold text-white mb-2">Application Successfully Submitted!</h2>
              <p class="text-gray-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                Your application for Program A Incubation has been locked and sent to evaluation managers.
              </p>
              <button type="button" @click="router.push('/dashboard')" class="bg-blue-600 hover:bg-blue-700 text-white px-6 h-10 rounded-lg text-sm font-medium transition-colors">
                Go to Dashboard
              </button>
            </div>
          </template>

        </form>
      </div>

    </div>
  </div>
</template>