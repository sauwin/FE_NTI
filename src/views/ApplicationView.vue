<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/axios'

const route = useRoute()
const router = useRouter()
const id = route.params.id
const app = ref<any>(null)
const docs = ref<any[]>([])
const error = ref('')
const deleting = ref(false)

onMounted(async () => {
  try {
    const [appRes, docsRes] = await Promise.all([
      api.get(`/applications/${id}`),
      api.get(`/applications/${id}/documents`),
    ])
    app.value = appRes.data
    docs.value = docsRes.data
  } catch {
    error.value = 'Could not load application'
  }
})

const statusColor = (status: string) => {
  if (status === 'approved') return 'bg-green-900/30 border-green-800 text-green-400'
  if (status === 'rejected') return 'bg-red-900/30 border-red-800 text-red-400'
  return 'bg-blue-900/30 border-blue-800 text-blue-400'
}

const docLabels: Record<string, string> = {
  executive_summary:      'Executive Summary',
  technical_architecture: 'Technical Architecture',
  roadmap:                'Roadmap',
  budget:                 'Budget',
  risk_analysis:          'Risk Analysis',
  monetization:           'Monetization Model',
  cv:                     'CV',
  motivation_letter:      'Motivation Letter',
  technical_proposal:     'Technical Proposal',
}

async function deleteApp() {
  if (!confirm('Are you sure you want to delete this application? This cannot be undone.')) return
  deleting.value = true
  try {
    await api.delete(`/applications/${id}`)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Could not delete application'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex justify-center px-4 py-12">
    <div class="w-full max-w-2xl">
      <button @click="router.push('/dashboard')" class="text-gray-500 hover:text-white text-sm mb-6">← Back to Dashboard</button>

      <p v-if="error" class="text-red-400">{{ error }}</p>

      <div v-if="app">
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-600/10 border border-blue-900 px-4 py-1.5 rounded-full mb-2">
              Program {{ app.program_type?.toUpperCase() }}
            </div>
            <h1 class="text-3xl font-bold text-white">Application #{{ app.id }}</h1>
            <p class="text-gray-500 text-sm mt-1">Submitted: {{ app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Not yet submitted' }}</p>
          </div>
          <span :class="['text-xs px-3 py-1 rounded-full border capitalize', statusColor(app.status)]">
            {{ app.status }}
          </span>
        </div>

        <!-- Details -->
        <div class="border border-slate-800 rounded-xl p-6 bg-slate-900/30 mb-4">
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">Details</div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">Applicant type</p>
              <p class="text-white capitalize">{{ app.applicant_type }}</p>
            </div>
            <div>
              <p class="text-gray-500">Program</p>
              <p class="text-white">Program {{ app.program_type?.toUpperCase() }}</p>
            </div>
            <div>
              <p class="text-gray-500">Status</p>
              <p class="text-white capitalize">{{ app.status }}</p>
            </div>
            <div>
              <p class="text-gray-500">Created</p>
              <p class="text-white">{{ new Date(app.created_at).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>

        <!-- Documents -->
        <div class="border border-slate-800 rounded-xl p-6 bg-slate-900/30 mb-6">
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">Documents</div>
          <div v-if="docs.length === 0" class="text-gray-500 text-sm">No documents uploaded.</div>
          <div v-else class="flex flex-col gap-2">
            <div v-for="doc in docs" :key="doc.id"
                 class="flex items-center justify-between border border-slate-700 rounded-lg px-4 py-2">
              <div>
                <p class="text-white text-sm">{{ docLabels[doc.type] ?? doc.type }}</p>
                <p class="text-gray-500 text-xs">{{ doc.file_name }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit button -->
        <div v-if="app.status === 'draft' || app.status === 'pending_revision'" class="flex gap-3">
          <router-link :to="`/applications/${app.id}/edit`"
                       class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
            Edit Application
          </router-link>
          <button @click="deleteApp" :disabled="deleting"
                  class="border border-red-900 hover:border-red-700 text-red-400 hover:text-red-300 px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>