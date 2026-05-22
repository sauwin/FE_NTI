<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import * as applicationsApi from '../../api/applications'

interface Application {
  id: number
  program_type: string
  status: string
  created_at: string
  updated_at: string
  submitted_at?: string
  rejection_reason?: string
}

const applications = ref<Application[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedApplication = ref<Application | null>(null)
const filterStatus = ref<string | null>(null)

const filteredApplications = computed(() => {
  if (!filterStatus.value) return applications.value
  return applications.value.filter(app => app.status === filterStatus.value)
})

const statusColors: { [key: string]: string } = {
  draft: 'bg-slate-700 text-slate-200',
  submitted: 'bg-blue-900 text-blue-200',
  under_review: 'bg-yellow-900 text-yellow-200',
  approved: 'bg-green-900 text-green-200',
  rejected: 'bg-red-900 text-red-200',
  completed: 'bg-purple-900 text-purple-200'
}

const fetchApplications = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await applicationsApi.getApplications()
    applications.value = response.data
    if (applications.value.length > 0) {
      selectApplication(applications.value[0])
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load applications'
  } finally {
    loading.value = false
  }
}

const selectApplication = (app: Application) => {
  selectedApplication.value = app
}

const deleteApplication = async (appId: number) => {
  if (!confirm('Are you sure you want to delete this application?')) return

  try {
    await applicationsApi.deleteApplication(String(appId))
    applications.value = applications.value.filter(app => app.id !== appId)
    selectedApplication.value = null
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete application'
  }
}

const getStatusLabel = (status: string): string => {
  const labels: { [key: string]: string } = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed'
  }
  return labels[status] || status
}

onMounted(() => {
  fetchApplications()
})
</script>

<template>
  <div class="space-y-6">
    <div class="section-label">Manage Applications</div>

    <div v-if="loading" class="text-slate-400">
      Loading applications...
    </div>

    <div v-else-if="error" class="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
      {{ error }}
    </div>

    <div v-else class="space-y-6">
      <!-- Status Filter -->
      <div class="flex gap-2 flex-wrap">
        <button @click="filterStatus = null"
                :class="[
                  'px-3 py-1 rounded-lg text-sm font-medium transition',
                  !filterStatus
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                ]">
          All
        </button>
        <button v-for="status in ['draft', 'submitted', 'under_review', 'approved', 'rejected']"
                :key="status"
                @click="filterStatus = status"
                :class="[
                  'px-3 py-1 rounded-lg text-sm font-medium transition',
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                ]">
          {{ getStatusLabel(status) }}
        </button>
      </div>

      <!-- Applications List -->
      <div>
        <div v-if="applications.length === 0" class="bg-slate-900/50 rounded-lg p-6 text-center text-slate-400">
          No applications yet
        </div>

        <div v-else class="space-y-3">
          <button v-for="app in filteredApplications"
                  :key="app.id"
                  @click="selectApplication(app)"
                  :class="[
                    'w-full text-left px-4 py-3 rounded-lg border transition',
                    selectedApplication?.id === app.id
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  ]">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-semibold text-white">Program {{ app.program_type.toUpperCase() }}</h4>
                <p class="text-sm text-slate-400">Created {{ new Date(app.created_at).toLocaleDateString() }}</p>
              </div>
              <span :class="[
                'text-xs font-semibold px-2 py-1 rounded',
                statusColors[app.status] || 'bg-slate-700 text-slate-200'
              ]">
                {{ getStatusLabel(app.status) }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Application Details -->
      <div v-if="selectedApplication" class="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 class="text-xl font-bold text-white">Program {{ selectedApplication.program_type.toUpperCase() }} Application</h3>
            <p class="text-slate-400 text-sm mt-2">Status: {{ getStatusLabel(selectedApplication.status) }}</p>
          </div>
          <div class="flex gap-2">
            <router-link v-if="selectedApplication.status === 'draft'"
                         :to="`/programs/${selectedApplication.program_type.toLowerCase()}/upload`"
                         class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              Continue
            </router-link>
            <button v-if="selectedApplication.status === 'draft'"
                    @click="deleteApplication(selectedApplication.id)"
                    class="text-red-400 hover:text-red-300 text-sm font-medium">
              Delete
            </button>
          </div>
        </div>

        <!-- Application Info -->
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="label-hint mb-1">Created</div>
              <p class="text-white">{{ new Date(selectedApplication.created_at).toLocaleString() }}</p>
            </div>
            <div>
              <div class="label-hint mb-1">Last Updated</div>
              <p class="text-white">{{ new Date(selectedApplication.updated_at).toLocaleString() }}</p>
            </div>
          </div>

          <div v-if="selectedApplication.submitted_at">
            <div class="label-hint mb-1">Submitted</div>
            <p class="text-white">{{ new Date(selectedApplication.submitted_at).toLocaleString() }}</p>
          </div>

          <div v-if="selectedApplication.rejection_reason" class="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <div class="label-hint text-red-400 mb-2">Rejection Reason</div>
            <p class="text-red-100">{{ selectedApplication.rejection_reason }}</p>
          </div>

          <!-- Documents Section -->
          <div>
            <div class="label-hint mb-3">Documents</div>
            <p class="text-slate-400 text-sm">View attached documents in the application details</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>