<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from '@/shared/composables/useConfirm'
import DocumentActionButtons from '@/shared/components/DocumentActionButtons.vue'
import MilestonesPanel from '@/features/milestones/components/MilestonesPanel.vue'
import { useAuthStore } from '@/features/auth/stores/auth'
import type { ApplicationRevisionRequest, ApplicationDocument } from '../types/applications'

import { 
  getApplicationById, 
  getApplicationDocuments, 
  deleteApplication,
  updateApplicationStatus,
  getApplicationLastRevision
} from '@/features/applications/api/applications'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const app = ref<any>(null)
const docs = ref<ApplicationDocument[]>([])
const revision = ref<ApplicationRevisionRequest | null>(null)
const error = ref('')
const deleting = ref(false)
const statusUpdating = ref(false)

const auth = useAuthStore();
const currentUserRole = auth.role || 'student'

onMounted(async () => {
  try {
    const [appRes, docsRes, revisionRes] = await Promise.all([
      getApplicationById(id),
      getApplicationDocuments(id),
      getApplicationLastRevision(id),
    ])
    app.value = appRes.data
    docs.value = docsRes.data
    revision.value = revisionRes.data
  } catch {
    error.value = 'Could not load application'
  }
})

const statusColor = (status: string) => {
  if (status === 'approved' || status === 'active') return 'bg-green-900/30 border-green-800 text-green-400'
  if (status === 'rejected') return 'bg-red-900/30 border-red-800 text-red-400'
  if (status === 'suspended') return 'bg-amber-900/30 border-amber-800 text-amber-400'
  if (status === 'closed') return 'bg-slate-800 text-slate-400 border-slate-700'
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
 * Permanently finishes the project lifecycle and sets to closed
 */
async function closeApp() {
  const confirmed = await useConfirm({
    title: 'Finish Project',
    message: 'Are you sure you want to finish this project? This closes all active sprints and concludes the mentorship permanently.',
    confirmText: 'Finish',
    cancelText: 'Cancel',
    danger: true,
  })
  if (!confirmed) return

  statusUpdating.value = true
  try {
    await updateApplicationStatus(id, 'closed')
    app.value.status = 'closed'
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Failed to finish application'
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

const documentsMap = computed(() =>
  Object.fromEntries(
    docs.value.map(doc => [doc.type, doc])
  )
)
</script>

<template>
  <div class="flex-center-page">
    <div class="w-full max-w-2xl">
      <button @click="router.push('/dashboard')" class="text-gray-500 hover:text-white text-sm mb-6">← Back to Dashboard</button>

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

        <div 
          v-if="auth.isStudent && app.status == 'pending_revision'"
          class="border border-amber-900/60 bg-amber-950/20 rounded-xl p-5 mb-6"
        >
          <div class="flex items-start gap-3.5 mb-2">
            <div class="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-600/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
              <span class="text-xs font-bold font-mono">!</span>
            </div>
          
            <h4 class="text-sm font-semibold text-amber-400 mb-1">Revision Required</h4>
          </div>

          <div class="mt-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-gray-400 font-mono whitespace-pre-wrap wrap-break-words">
              <span class="text-amber-500/80 font-semibold uppercase tracking-wider block mb-1">[ Reviewer Comment ]</span>
              {{ revision ? revision?.message : 'No message' }}
          </div>
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
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">Required Documents</div>
          
          <div v-if="!app.call?.required_documents || app.call.required_documents.length === 0" class="text-gray-500 text-sm">
            No specific documents required for this challenge.
          </div>

          <div v-else class="flex flex-col gap-3">
            <div 
              v-for="req in (typeof app.call.required_documents === 'string' ? JSON.parse(app.call.required_documents) : app.call.required_documents)" 
              :key="req.id"
              class="flex flex-col gap-3 border border-slate-700/60 rounded-lg px-4 py-3 bg-slate-950/40"
            >
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-white text-sm font-medium">
                    {{ req.document_name }}
                    <span v-if="req.is_mandatory" class="text-gray-300 text-xs">*</span>
                  </p>
                  <p class="text-gray-500 text-[11px] mt-0.5">File size: {{ documentsMap[req] ? (documentsMap[req].file_size_bytes / (1024 * 1024)).toFixed(2) : '-'  }} MB</p>
                </div>

                <span v-if="documentsMap[req]" class="text-[10px] bg-emerald-950/50 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded font-mono uppercase">
                  Uploaded
                </span>
                <span v-else class="text-[10px] bg-rose-950/30 text-rose-400/70 border border-rose-950 px-2 py-0.5 rounded font-mono uppercase">
                  Missing
                </span>
              </div>

              <div v-if="documentsMap[req]" class="pt-2 border-t border-slate-800/60">
                <p class="text-xs text-slate-400 mb-2 font-mono truncate">
                  File: {{ documentsMap[req]!.file_name }}
                </p>
                <DocumentActionButtons
                  :documentId="documentsMap[req]!.id"
                  :fileName="documentsMap[req]!.file_name"
                  :mimeType="documentsMap[req]!.mime_type"
                />
              </div>
            </div>
          </div>
        </div>

        <MilestonesPanel v-if="app" :application-id="id" />

        <div v-if="app.status === 'draft' || app.status === 'pending_revision'" class="flex gap-3 mt-8">
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
          v-if="(currentUserRole === 'admin' || currentUserRole === 'mentor') && app.status !== 'closed'" 
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
              @click="closeApp"
              :disabled="statusUpdating"
              class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-medium border border-slate-700 transition disabled:opacity-50"
            >
              Finish Project
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>