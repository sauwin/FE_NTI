<script setup lang="ts">
  import { watch, ref, onMounted, computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import api from '@/shared/api/axios'
  import { getTeams } from '@/features/student/api/teams'
  import { useAuthStore } from '@/features/auth/stores/auth'

  const route = useRoute()
  const router = useRouter()
  const error = ref('')
  const loading = ref(false)
  const step = ref(1)
  const auth = useAuthStore()
  const callId = ref<number | null>(null)

  const editId = ref<number | null>(route.query.edit ? Number(route.query.edit) : null)
  const isEditMode = computed(() => !!editId.value)
  const DRAFT_KEY = 'draft_program_a'

  const myTeams = ref<any[]>([])            
  const selectedTeamId = ref<number | null>(null) 
  const loadingTeams = ref(false)

  const category = ref('')
  const academicDeclaration = ref(false)

  interface RequiredDoc {
    document_name: string
    is_mandatory: boolean
    max_size_mb: number
  }
  const requiredDocuments = ref<RequiredDoc[]>([])
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

  async function fetchUserTeams() {
    loadingTeams.value = true
    try {
      const res = await getTeams()
      // Переконуємось, що користувач авторизований перед фільтрацією за його ID
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
    if (!auth.isLoggedIn) { router.push('/auth/login'); return }

    await fetchUserTeams()

    try {
      const res = await api.get('/calls/active/a')
      callId.value = res.data.id
      const docs: RequiredDoc[] = res.data.required_documents ?? []
      if (Array.isArray(docs) && docs.length > 0) {
        requiredDocuments.value = docs
        docs.forEach(doc => { files.value[docKey(doc.document_name)] = null })
      } else {
        error.value = 'Active call has no required documents configured.'
      }
    } catch {
      error.value = 'No active call available'
    }

    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      const draft = JSON.parse(saved)
      selectedTeamId.value = draft.selectedTeamId ?? null
      category.value = draft.category ?? ''
      academicDeclaration.value = draft.academicDeclaration ?? false
    }
  })

  watch([selectedTeamId, category, academicDeclaration], () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      selectedTeamId: selectedTeamId.value,
      category: category.value,
      academicDeclaration: academicDeclaration.value,
    }))
  })

  function onFileChange(key: string, event: Event) {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      files.value[key] = input.files[0]
    }
  }

  function nextStep() {
    error.value = ''
    if (!selectedTeamId.value) { error.value = 'Please select a qualified team'; return }
    if (!category.value) { error.value = 'Please select a category'; return }
    if (!academicDeclaration.value) { error.value = 'You must confirm the academic declaration'; return }
    step.value = 2
  }

  async function submit() {
    if (!callId.value) { error.value = 'No active call available'; return }
    error.value = ''
    loading.value = true

    try {
      let applicationId: number

      const payload = {
        applicant_type: 'team',
        program_type: 'a',
        team_id: selectedTeamId.value,
        category: category.value,
      }

      if (isEditMode.value) {
        await api.patch(`/applications/${editId.value}`, payload)
        applicationId = editId.value!
      } else {
        const appRes = await api.post('/applications', payload)
        applicationId = appRes.data.application_id
      }

      for (const doc of requiredDocuments.value) {
        const key = docKey(doc.document_name)
        const file = files.value[key]
        if (!file && doc.is_mandatory) {
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

        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      localStorage.removeItem(DRAFT_KEY)
      step.value = 3
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Something went wrong.'
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="flex-center-page">
    <div class="w-full max-w-xl">

      <div class="mb-8 text-center">
        <div class="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-600/10 border border-blue-900 px-4 py-1.5 rounded-full mb-4">
          Program A
        </div>
        <h1 class="font-bold text-4xl text-white">Submit Application</h1>
        <p class="text-gray-400 mt-2 text-sm">Grant incubation program</p>
      </div>

      <div class="flex items-center mb-8">
        <div class="flex-center">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',
            step >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">1</div>
          <span class="text-xs mt-1.5" :class="step >= 1 ? 'text-blue-400' : 'text-gray-600'">Info</span>
        </div>
        <div class="flex-1 h-px mx-2 mb-4" :class="step >= 2 ? 'bg-blue-600' : 'bg-blue-900'"></div>
        <div class="flex-center">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',
            step >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">2</div>
          <span class="text-xs mt-1.5" :class="step >= 2 ? 'text-blue-400' : 'text-gray-600'">Documents</span>
        </div>
        <div class="flex-1 h-px mx-2 mb-4" :class="step >= 3 ? 'bg-blue-600' : 'bg-blue-900'"></div>
        <div class="flex-center">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',
            step >= 3 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">3</div>
          <span class="text-xs mt-1.5" :class="step >= 3 ? 'text-blue-400' : 'text-gray-600'">Final</span>
        </div>
      </div>

      <div v-if="step === 3" class="text-center py-12">
        <div class="text-5xl mb-4">✓</div>
        <h2 class="text-2xl font-bold text-white mb-2">Application Submitted</h2>
        <p class="text-gray-400 text-sm mb-6">Your application is under review. We'll notify you by email.</p>
        <button @click="router.push('/dashboard')"
          class="bg-blue-600 hover:bg-blue-700 text-white px-8 h-10 rounded-md text-sm cursor-pointer">
          Go to Dashboard
        </button>
      </div>

      <form v-else-if="step === 1" class="flex-col-gap" @submit.prevent="nextStep">
        <p v-if="error" class="text-error-sm">{{ error }}</p>

        <div>
          <label class="label">Select Your Team <span class="text-error">*</span></label>
          <div v-if="loadingTeams" class="text-xs text-slate-500 mt-1">Loading your teams...</div>
          
          <select 
            v-else
            v-model="selectedTeamId"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option :value="null" disabled class="bg-dark">Choose a team ready for Program A</option>
            <option v-for="team in myTeams" :key="team.id" :value="team.id" class="bg-dark">
              {{ team.name }} ({{ team.members?.length ?? 0 }} members)
            </option>
          </select>
          
          <p v-if="myTeams.length === 0 && !loadingTeams" class="text-[11px] text-amber-500/90 mt-1.5">
            ⚠️ You don't have any teams where you are the leader AND that have at least 3 accepted members. 
            Go to "My Teams" to manage your team setup first.
          </p>
        </div>

        <div>
          <label class="label">Category <span class="text-error">*</span></label>
          <select v-model="category"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white focus:outline-none focus:border-blue-500">
            <option value="" disabled class="bg-dark">Select a category</option>
            <option v-for="cat in categories" :key="cat" :value="cat" class="bg-dark">{{ cat }}</option>
          </select>
        </div>

        <div class="bg-blue-600/10 border border-blue-900 rounded-md p-4">
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="academicDeclaration" type="checkbox" class="mt-0.5 accent-blue-500" />
            <span class="text-sm text-gray-300">
              I declare that I have no carried-over courses and my average grade of core courses meets the required threshold. I understand this will be verified by the committee.
            </span>
          </label>
        </div>

        <button 
          type="submit"
          :disabled="myTeams.length === 0"
          class="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 cursor-pointer text-white w-full h-10 mt-2 rounded-md text-sm font-medium transition"
        >
          Continue to Documents →
        </button>
      </form>

      <form v-else-if="step === 2" class="flex-col-gap" @submit.prevent="submit">
        <p v-if="error" class="text-error-sm">{{ error }}</p>

        <div v-if="requiredDocuments.length === 0" class="text-gray-500 text-sm italic text-center py-4">
          Loading required documents...
        </div>

        <template v-else>
          <p class="text-gray-400 text-sm">
            Upload all required documents before submitting.
            <span class="text-blue-400">{{ requiredDocuments.filter(d => d.is_mandatory).length }} required</span>
            <span v-if="requiredDocuments.filter(d => !d.is_mandatory).length > 0" class="text-gray-500">
              , {{ requiredDocuments.filter(d => !d.is_mandatory).length }} optional
            </span>
          </p>

          <div v-for="doc in requiredDocuments" :key="doc.document_name">
            <label class="label">
              {{ doc.document_name }}
              <span v-if="doc.is_mandatory" class="text-error">*</span>
              <span v-else class="text-gray-600 text-xs ml-1">(optional)</span>
              <span class="text-gray-600 text-xs ml-1">· max {{ doc.max_size_mb }}MB</span>
            </label>
            <div class="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                @change="onFileChange(docKey(doc.document_name), $event)"
                class="hidden"
                :id="`file-${docKey(doc.document_name)}`"
              />
              <label
                :for="`file-${docKey(doc.document_name)}`"
                class="flex items-center justify-between bg-blue-600/10 border border-blue-900 hover:border-blue-600 rounded-md px-3 h-9 cursor-pointer transition-colors"
                :class="{ 'border-blue-500': files[docKey(doc.document_name)] }"
              >
                <span class="text-sm truncate pr-2" :class="files[docKey(doc.document_name)] ? 'text-white' : 'text-gray-600'">
                  {{ files[docKey(doc.document_name)]?.name ?? 'Choose file...' }}
                </span>
                <span class="text-xs text-blue-400 flex-shrink-0">Browse</span>
              </label>
            </div>
          </div>
        </template>

        <div class="flex gap-3 mt-2">
          <button type="button" @click="step = 1"
            class="border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white w-1/3 h-10 rounded-md text-sm cursor-pointer transition-colors">
            ← Back
          </button>
          <button type="submit" :disabled="loading || requiredDocuments.length === 0"
            class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-white flex-1 h-10 rounded-md text-sm font-medium">
            {{ loading ? 'Submitting...' : 'Submit Application' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>