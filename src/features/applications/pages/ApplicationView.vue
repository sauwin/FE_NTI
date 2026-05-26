<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from '@/shared/composables/useConfirm'
import DocumentActionButtons from '@/shared/components/DocumentActionButtons.vue'
import MilestonesPanel from '@/features/milestones/components/MilestonesPanel.vue'
import { useAuthStore } from '@/features/auth/stores/auth'

import { 
  getApplicationById, 
  getApplicationDocuments, 
  deleteApplication,
  updateApplicationStatus
} from '@/features/applications/api/applications'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const app = ref<any>(null)
const docs = ref<any[]>([])
const error = ref('')
const deleting = ref(false)
const statusUpdating = ref(false)

const auth = useAuthStore();
const currentUserRole = auth.role || 'student'

onMounted(async () => {
  try {
    const [appRes, docsRes] = await Promise.all([
      getApplicationById(id),
      getApplicationDocuments(id),
    ])
    app.value = appRes.data
    docs.value = docsRes.data
  } catch {
    error.value = 'Could not load application'
  }
})

const statusColor = (status: string) => {
  if (status === 'approved' || status === 'active') return 'bg-green-900/30 border-green-800 text-green-400'
  if (status === 'rejected') return 'bg-red-900/30 border-red-800 text-red-400'
  if (status === 'suspended') return 'bg-amber-900/30 border-amber-800 text-amber-400'
  if (status === 'archived') return 'bg-slate-800 text-slate-400 border-slate-700'
  return 'bg-blue-900/30 border-blue-800 text-blue-400'
}

const docLabels: Record<string, string> = {
  executive_summary: 'Executive Summary',
  technical_architecture: 'Technical Architecture',
  roadmap: 'Roadmap',
  budget: 'Budget',
  risk_analysis: 'Risk Analysis',
  monetization: 'Monetization Model',
  cv: 'CV',
  motivation_letter: 'Motivation Letter',
  technical_proposal: 'Technical Proposal',
}

/**
 * Toggles application state between suspended and active
 */
async function toggleSuspension() {
  const isCurrentlySuspended = app.value.status === 'suspended'
  const nextStatus = isCurrentlySuspended ? 'active' : 'suspended'
  
  const confirmed = await useConfirm({
    title: isCurrentlySuspended ? 'Resume Project' : 'Suspend Project',
    message: isCurrentlySuspended 
      ? 'Are you sure you want to resume this project? This will restore regular access.' 
      : 'Are you sure you want to suspend this project? Mentorship logging will be locked temporarily.',
    confirmText: isCurrentlySuspended ? 'Resume' : 'Suspend',
    cancelText: 'Cancel',
    danger: !isCurrentlySuspended,
  })
  if (!confirmed) return

  statusUpdating.value = true
  try {
    await updateApplicationStatus(id, nextStatus)
    app.value.status = nextStatus
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Failed to update configuration status'
  } finally {
    statusUpdating.value = false
  }
}

/**
 * Permanently finishes the project lifecycle and sets to archived
 */
async function archiveApp() {
  const confirmed = await useConfirm({
    title: 'Archive Project',
    message: 'Are you sure you want to archive this project? This closes all active sprints and concludes the mentorship permanently.',
    confirmText: 'Archive',
    cancelText: 'Cancel',
    danger: true,
  })
  if (!confirmed) return

  statusUpdating.value = true
  try {
    await updateApplicationStatus(id, 'archived')
    app.value.status = 'archived'
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Failed to archive application'
  } finally {
    statusUpdating.value = false
  }
}

async function deleteApp() {
  const confirmed = await useConfirm({
    title: 'Delete Application',
    message: 'Delete this application? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true,
  })
  if (!confirmed) return

  deleting.value = true
  try {
    await deleteApplication(id)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Could not delete application'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex-center-page">
    <div class="w-full max-w-2xl">
      <button @click="router.back()" class="text-gray-500 hover:text-white text-sm mb-6">← Back to Dashboard</button>

      <p v-if="error" class="text-error mb-4">{{ error }}</p>

      <div v-if="app">
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-600/10 border border-blue-900 px-4 py-1.5 rounded-full mb-2">
              Program {{ app.program_type?.toUpperCase() }}
            </div>
            <h1 class="text-3xl font-bold text-white">Application #{{ app.id }}</h1>
            <p class="text-gray-500 text-sm mt-1">Submitted: {{ app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Not yet submitted' }}</p>
          </div>
          <span :class="['text-xs px-3 py-1 rounded-full border capitalize font-mono', statusColor(app.status)]">
            {{ app.status?.replace(/_/g, ' ') }}
          </span>
        </div>

        <div class="border border-slate-800 rounded-xl p-6 bg-slate-900/30 mb-4">
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">Details</div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">Category</p>
              <p class="text-white capitalize">{{ app.category }}</p>
            </div>
            <div>
              <p class="text-gray-500">Program</p>
              <p class="text-white">Program {{ app.program_type?.toUpperCase() }}</p>
            </div>
            <div>
              <p class="text-gray-500">Status</p>
              <p class="text-white capitalize">{{ app.status?.replace(/_/g, ' ') }}</p>
            </div>
            <div>
              <p class="text-gray-500">Created</p>
              <p class="text-white">{{ new Date(app.created_at).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>

        <div class="border border-slate-800 rounded-xl p-6 bg-slate-900/30 mb-6">
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">Documents</div>
          <div v-if="docs.length === 0" class="text-gray-500 text-sm">No documents uploaded.</div>
          <div v-else class="flex flex-col gap-2">
            <div v-for="doc in docs" :key="doc.id"
                 class="flex flex-col gap-3 border border-slate-700 rounded-lg px-4 py-3 bg-slate-950/40">
              <div>
                <p class="text-white text-sm">{{ docLabels[doc.type] ?? doc.type }}</p>
                <p class="text-gray-500 text-xs">{{ doc.file_name }}</p>
              </div>
              <DocumentActionButtons
                :documentId="doc.id"
                :fileName="doc.file_name"
                :mimeType="doc.mime_type"
              />
            </div>
          </div>
        </div>

        <MilestonesPanel v-if="app" :application-id="id" />

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

        <div 
          v-if="(currentUserRole === 'admin' || currentUserRole === 'mentor') && app.status !== 'archived'" 
          class="border border-slate-800 rounded-xl p-4 bg-slate-950/40 mt-6 flex items-center justify-between gap-3"
        >
          <div>
            <p class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">Project Management Console</p>
            <p class="text-[11px] text-slate-500 mt-0.5">Update development lifecycles or put operations on standby.</p>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="toggleSuspension"
              :disabled="statusUpdating"
              class="px-3 py-1.5 rounded text-xs font-medium border transition disabled:opacity-50"
              :class="app.status === 'suspended' 
                ? 'bg-green-950/40 border-green-800 text-green-400 hover:bg-green-900/30' 
                : 'bg-amber-950/40 border-amber-800 text-amber-400 hover:bg-amber-900/30'"
            >
              {{ app.status === 'suspended' ? 'Resume Operations' : 'Suspend Project' }}
            </button>
            
            <button 
              @click="archiveApp"
              :disabled="statusUpdating"
              class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-medium border border-slate-700 transition disabled:opacity-50"
            >
              Archive Project
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>