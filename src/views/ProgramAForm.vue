<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'

const router = useRouter()
const error = ref('')
const loading = ref(false)
const step = ref(1)

// Step 1 — Team info
const teamName = ref('')
const teamDescription = ref('')
const category = ref('')
const academicDeclaration = ref(false)

// Step 2 — Documents
const files = ref<Record<string, File | null>>({
  executive_summary: null,
  technical_architecture: null,
  roadmap: null,
  budget: null,
  risk_analysis: null,
  monetization: null,
})

const docLabels: Record<string, string> = {
  executive_summary: 'Executive Summary',
  technical_architecture: 'Technical Architecture',
  roadmap: 'Roadmap',
  budget: 'Budget',
  risk_analysis: 'Risk Analysis',
  monetization: 'Monetization Model',
}

const categories = [
  'Software Development',
  'AI & Data Technologies',
  'Web Applications',
  'Game Development',
  'IoT & Embedded Systems',
]

// Auth guard
onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/auth/login')
    return
  }
  try {
    await api.get('/auth/me')
  } catch {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }
})

function onFileChange(type: string, event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    files.value[type] = input.files[0]
  }
}

function nextStep() {
  error.value = ''
  if (!teamName.value.trim()) { error.value = 'Team name is required'; return }
  if (!category.value) { error.value = 'Please select a category'; return }
  if (!academicDeclaration.value) { error.value = 'You must confirm the academic declaration'; return }
  step.value = 2
}

async function submit() {
  error.value = ''
  loading.value = true
 
  const typeMap: Record<string, string> = {
    executive_summary:      'executive_summary',
    technical_architecture: 'technical_architecture',
    roadmap:                'roadmap',
    budget:                 'budget',
    risk_analysis:          'risk_analysis',
    monetization:           'monetization',
  }
 
  try {
    const appRes = await api.post('/applications', {
      call_id: 1,
      applicant_type: 'team',
      program_type: 'a',
    })
    const applicationId = appRes.data.application_id
 
    for (const [type, file] of Object.entries(files.value)) {
      if (!file) { error.value = `Missing: ${docLabels[type]}`; loading.value = false; return }
 
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', typeMap[type] ?? type)
      formData.append('classification', 'confidential')
      formData.append('application_id', String(applicationId))
 
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
 
    step.value = 3
 
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Upload failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex justify-center px-4 py-12">
    <div class="w-full max-w-xl">

      <div class="mb-8 text-center">
        <div class="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-600/10 border border-blue-900 px-4 py-1.5 rounded-full mb-4">
          Program A
        </div>
        <h1 class="font-bold text-4xl text-white">Submit Application</h1>
        <p class="text-gray-400 mt-2 text-sm">Grant incubation program</p>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center mb-8">
        <div class="flex flex-col items-center">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',
            step >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">1</div>
          <span class="text-xs mt-1.5" :class="step >= 1 ? 'text-blue-400' : 'text-gray-600'">Info</span>
        </div>

        <div class="flex-1 h-px mx-2 mb-4" :class="step >= 2 ? 'bg-blue-600' : 'bg-blue-900'"></div>

        <div class="flex flex-col items-center">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',
            step >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">2</div>
          <span class="text-xs mt-1.5" :class="step >= 2 ? 'text-blue-400' : 'text-gray-600'">Documents</span>
        </div>

        <div class="flex-1 h-px mx-2 mb-4" :class="step >= 3 ? 'bg-blue-600' : 'bg-blue-900'"></div>

        <div class="flex flex-col items-center">
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

      <!-- STEP 1 — Team Info -->
      <form v-else-if="step === 1" class="flex flex-col gap-4" @submit.prevent="nextStep">
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

        <div>
          <label class="block text-white text-sm mb-1">Team name <span class="text-red-400">*</span></label>
          <input v-model="teamName" type="text" placeholder="e.g. TechVision Team"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label class="block text-white text-sm mb-1">Short description</label>
          <textarea v-model="teamDescription" rows="3" placeholder="Briefly describe your project idea..."
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"></textarea>
        </div>

        <div>
          <label class="block text-white text-sm mb-1">Category <span class="text-red-400">*</span></label>
          <select v-model="category"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white focus:outline-none focus:border-blue-500">
            <option value="" disabled class="bg-[#080f1e]">Select a category</option>
            <option v-for="cat in categories" :key="cat" :value="cat" class="bg-[#080f1e]">{{ cat }}</option>
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

        <button type="submit"
          class="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white w-full h-10 mt-2 rounded-md text-sm font-medium">
          Continue to Documents →
        </button>
      </form>

      <!-- STEP 2 — Documents -->
      <form v-else-if="step === 2" class="flex flex-col gap-4" @submit.prevent="submit">
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

        <p class="text-gray-400 text-sm">Upload all 6 required documents before submitting.</p>

        <div v-for="(label, type) in docLabels" :key="type">
          <label class="block text-white text-sm mb-1">
            {{ label }} <span class="text-red-400">*</span>
          </label>
          <div class="relative">
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx"
              @change="onFileChange(type, $event)"
              class="hidden" :id="`file-${type}`" />
            <label :for="`file-${type}`"
              class="flex items-center justify-between bg-blue-600/10 border border-blue-900 hover:border-blue-600 rounded-md px-3 h-9 cursor-pointer transition-colors">
              <span class="text-sm" :class="files[type] ? 'text-white' : 'text-gray-600'">
                {{ files[type] ? files[type]!.name : 'Choose file...' }}
              </span>
              <span class="text-xs text-blue-400">Browse</span>
            </label>
          </div>
        </div>

        <div class="flex gap-3 mt-2">
          <button type="button" @click="step = 1"
            class="border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white w-1/3 h-10 rounded-md text-sm cursor-pointer transition-colors">
            ← Back
          </button>
          <button type="submit" :disabled="loading"
            class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-white flex-1 h-10 rounded-md text-sm font-medium">
            {{ loading ? 'Submitting...' : 'Submit Application' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>