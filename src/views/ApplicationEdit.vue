<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/axios'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const error = ref('')
const loading = ref(false)
const programType = ref('')

// Program A fields
const teamName = ref('')
const teamDescription = ref('')
const category = ref('')
const academicDeclaration = ref(false)

// Program B fields
const projectTitle = ref('')
const proposedSolution = ref('')

// Documents
const files = ref<Record<string, File | null>>({})
const existingDocs = ref<any[]>([])

const docLabelsA: Record<string, string> = {
  executive_summary: 'Executive Summary',
  technical_architecture: 'Technical Architecture',
  roadmap: 'Roadmap',
  budget: 'Budget',
  risk_analysis: 'Risk Analysis',
  monetization: 'Monetization Model',
}

const docLabelsB: Record<string, string> = {
  cv: 'CV',
  motivation_letter: 'Motivation Letter',
  technical_proposal: 'Technical Proposal',
}

const DRAFT_KEY = `draft_edit_${id}`

onMounted(async () => {
  try {
    const [appRes, docsRes] = await Promise.all([
      api.get(`/applications/${id}`),
      api.get(`/applications/${id}/documents`),
    ])
    programType.value = appRes.data.program_type
    existingDocs.value = docsRes.data

    // load draft if exists
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      const d = JSON.parse(saved)
      teamName.value = d.teamName ?? ''
      teamDescription.value = d.teamDescription ?? ''
      category.value = d.category ?? ''
      projectTitle.value = d.projectTitle ?? ''
      proposedSolution.value = d.proposedSolution ?? ''
    }
  } catch {
    error.value = 'Could not load application'
  }
})

function onFileChange(type: string, event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) files.value[type] = input.files[0]
}

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await api.patch(`/applications/${id}`, {
      applicant_type: 'team',
      program_type: programType.value,
    })

    for (const [type, file] of Object.entries(files.value)) {
      if (!file) continue
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('classification', 'confidential')
      formData.append('application_id', String(id))
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    localStorage.removeItem(DRAFT_KEY)
    router.push(`/applications/${id}`)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Update failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex-center-page">
    <div class="w-full max-w-xl">
      <button @click="router.push(`/applications/${id}`)" class="text-gray-500 hover:text-white text-sm mb-6">← Back to Application</button>

      <div class="mb-8">
        <h1 class="font-bold text-3xl text-white">Edit Application #{{ id }}</h1>
        <p class="text-gray-400 mt-1 text-sm">You can re-upload documents or update your application details.</p>
      </div>

      <p v-if="error" class="text-red-400 text-sm mb-4">{{ error }}</p>

      <form class="flex-col-gap" @submit.prevent="submit">

        <!-- Program A fields -->
        <template v-if="programType === 'a'">
          <div>
            <label class="label">Team name</label>
            <input v-model="teamName" type="text"
                   class="input" />
          </div>
          <div>
            <label class="label">Description</label>
            <textarea v-model="teamDescription" rows="3"
                      class="textarea"></textarea>
          </div>
        </template>

        <!-- Program B fields -->
        <template v-if="programType === 'b'">
          <div>
            <label class="label">Project title</label>
            <input v-model="projectTitle" type="text"
                   class="input" />
          </div>
          <div>
            <label class="label">Proposed solution</label>
            <textarea v-model="proposedSolution" rows="4"
                      class="textarea"></textarea>
          </div>
        </template>

        <!-- Documents -->
        <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mt-2">Re-upload Documents</div>
        <p class="text-gray-500 text-xs -mt-2">Leave empty to keep existing files.</p>

        <div v-for="(label, type) in (programType === 'a' ? docLabelsA : docLabelsB)" :key="type">
          <label class="label">{{ label }}</label>
          <div class="text-gray-600 text-xs mb-1">
            Current: {{ existingDocs.find(d => d.type === type)?.file_name ?? 'None' }}
          </div>
          <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx"
                 @change="onFileChange(type, $event)"
                 class="hidden" :id="`file-${type}`" />
          <label :for="`file-${type}`"
                 class="flex items-center justify-between bg-blue-600/10 border border-blue-900 hover:border-blue-600 rounded-md px-3 h-9 cursor-pointer transition-colors">
            <span class="text-sm" :class="files[type] ? 'text-white' : 'text-gray-600'">
              {{ files[type] ? (files[type] as File).name : 'Choose new file...' }}
            </span>
            <span class="text-xs text-blue-400">Browse</span>
          </label>
        </div>

        <div class="flex gap-3 mt-2">
          <button type="button" @click="router.push(`/applications/${id}`)"
                  class="border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white w-1/3 h-10 rounded-md text-sm cursor-pointer">
            Cancel
          </button>
          <button type="submit" :disabled="loading"
                  class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-white flex-1 h-10 rounded-md text-sm font-medium">
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>