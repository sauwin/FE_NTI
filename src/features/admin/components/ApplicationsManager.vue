<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { getAdminApplications, updateAdminApplicationStatus, exportApplications } from '@/features/admin/api/admin'
import api from '@/shared/api/axios' 
import type { AdminApplicationListItem } from '@/features/admin/types/admin'
import { useRouter } from 'vue-router'

const props = defineProps<{
  filterCallId?: number | null
}>()

const emit = defineEmits(['clear-filter'])
const router = useRouter()

const ALL_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'text-slate-400' },
  { value: 'submitted', label: 'Submitted', color: 'text-blue-400' },
  { value: 'formally_verified', label: 'Formally Verified', color: 'text-yellow-400' },
  { value: 'under_evaluation', label: 'Under Evaluation', color: 'text-indigo-400' },
  { value: 'pending_revision', label: 'Pending Revision', color: 'text-purple-400' },
  { value: 'approved', label: 'Approved', color: 'text-green-400' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-400' },
  { value: 'onboarding', label: 'Onboarding', color: 'text-orange-400' },
  { value: 'active', label: 'Active', color: 'text-emerald-400' },
  { value: 'suspended', label: 'Suspended', color: 'text-rose-400' },
  { value: 'closed', label: 'Closed', color: 'text-rose-600' },
]

const ALLOWED_ADMIN_ACTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'formally_verified', label: 'Formally Verified' },
  { value: 'under_evaluation', label: 'Under Evaluation' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' },
]

const PROGRAM_TYPES = [
  { value: 'a', label: 'Program A' },
  { value: 'b', label: 'Program B' }
]

const applications = ref<AdminApplicationListItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const searchQuery = ref('')
const filterProgramType = ref('')
const filterStatus = ref('')

const changingStatusId = ref<number | null>(null)

const showRevisionModal = ref(false)
const revisionAppId = ref<number | null>(null)
const revisionMessage = ref('')
const revisionLoading = ref(false)

async function loadApplications() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value }
    if (props.filterCallId) params.call_id = props.filterCallId
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (filterProgramType.value) params.program_type = filterProgramType.value
    if (filterStatus.value) params.status = filterStatus.value

    const res = await getAdminApplications(params)

    if (res.data && res.data.data) {
      applications.value = res.data.data
      currentPage.value = res.data.current_page
      totalPages.value = res.data.last_page
      totalItems.value = res.data.total
    } else {
      applications.value = Array.isArray(res.data) ? res.data : []
      totalPages.value = 1
      totalItems.value = applications.value.length
    }
  } catch (error) {
    console.error('Failed to load applications', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadApplications()
}

function handleFilterChange() {
  currentPage.value = 1
  loadApplications()
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadApplications()
}

async function handleStatusSelect(id: number, targetStatus: string) {
  if (targetStatus === 'request_revision') {
    revisionAppId.value = id
    revisionMessage.value = ''
    showRevisionModal.value = true
    return
  }

  changingStatusId.value = id
  try {
    await updateAdminApplicationStatus(id, targetStatus)
    const app = applications.value.find(a => a.id === id)
    if (app) app.status = targetStatus
  } catch {
    alert('Error while changing status')
    loadApplications() 
  } finally {
    changingStatusId.value = null
  }
}

async function submitRevision() {
  if (!revisionMessage.value.trim() || !revisionAppId.value) return
  
  revisionLoading.value = true
  try {
    await api.post(`/admin/applications/${revisionAppId.value}/revisions`, {
      message: revisionMessage.value.trim()
    })
    
    const app = applications.value.find(a => a.id === revisionAppId.value)
    if (app) app.status = 'pending_revision'
    
    showRevisionModal.value = false
  } catch (error) {
    alert('Failed to submit revision request.')
  } finally {
    revisionLoading.value = false
  }
}

function viewDetail(id: number) {
  router.push(`/applications/${id}`)
}

async function downloadExport(format: 'csv' | 'xlsx' = 'xlsx') {
  try {
    const params: any = { format }
    if (searchQuery.value && searchQuery.value.trim() !== '') params.search = searchQuery.value.trim()
    if (props.filterCallId) params.call_id = props.filterCallId
    if (filterProgramType.value) params.program_type = filterProgramType.value
    if (filterStatus.value) params.status = filterStatus.value

    const response = await exportApplications(params)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `applications.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export error:', error)
    alert('Failed to download export.')
  }
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-slate-800 text-slate-400 border-slate-700',
    submitted: 'bg-blue-900/40 text-blue-400 border-blue-800',
    formally_verified: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    under_evaluation: 'bg-indigo-900/40 text-indigo-400 border-indigo-800',
    approved: 'bg-green-900/40 text-green-400 border-green-800',
    active: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    rejected: 'bg-red-900/40 text-red-400 border-red-800',
    pending_revision: 'bg-purple-900/40 text-purple-400 border-purple-800',
    onboarding: 'bg-orange-900/40 text-orange-400 border-orange-800',
    suspended: 'bg-rose-900/40 text-rose-400 border-rose-800',
    closed: 'bg-rose-900/40 text-rose-600 border-rose-900',
  }
  return map[status] ?? 'bg-slate-800 text-slate-400 border-slate-700'
}

onMounted(() => {
  loadApplications()
})

watch(() => props.filterCallId, () => {
  currentPage.value = 1
  loadApplications()
})
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    <div class="flex flex-col gap-4 mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-xl font-bold text-white">Applications Management</h3>
          <p v-if="filterCallId" class="text-sm text-blue-400 mt-1 flex items-center gap-2">
            <span>Filtered for Call ID: {{ filterCallId }}</span>
            <button @click="$emit('clear-filter')" class="text-slate-500 hover:text-slate-300 underline text-xs cursor-pointer">Clear filter</button>
          </p>
        </div>
        
        <div class="flex-shrink-0 gap-2 flex">
          <button @click="downloadExport('csv')" :disabled="loading" class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono">Export CSV</button>
          <button @click="downloadExport('xlsx')" :disabled="loading" class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono">Export XLSX</button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center w-full">
        <div class="sm:col-span-2">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="Search by name or email..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
          />
        </div>

        <div>
          <select v-model="filterProgramType" @change="handleFilterChange" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer">
            <option value="">All Programs</option>
            <option v-for="type in PROGRAM_TYPES" :key="type.value" :value="type.value">{{ type.label }}</option>
          </select>
        </div>

        <div>
          <select v-model="filterStatus" @change="handleFilterChange" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer">
            <option value="">All Statuses</option>
            <option v-for="s in ALL_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-slate-500 animate-pulse py-4 font-mono text-sm">Loading data...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
          <tr>
            <th class="px-4 py-3 rounded-tl-lg">ID</th>
            <th class="px-4 py-3">Applicant</th>
            <th class="px-4 py-3">Program / Call</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3 rounded-tr-lg text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in applications" :key="app.id" class="border-b border-slate-800 hover:bg-slate-800/30 transition">
            <td class="px-4 py-4 font-mono text-slate-500">#{{ app.id }}</td>
            <td class="px-4 py-4">
              <div class="font-semibold text-white">{{ app.applicant_name }}</div>
              <div class="text-xs text-slate-500 font-mono">{{ app.applicant_email }}</div>
            </td>
            <td class="px-4 py-4">
              <span class="font-mono px-1.5 py-0.5 rounded border text-[10px] mr-1" :class="app.program_type === 'A' ? 'bg-blue-950/60 text-blue-400 border-blue-900' : 'bg-indigo-950/60 text-indigo-400 border-indigo-900'">
                Program {{ app.program_type }}
              </span>
              <div class="text-slate-500 text-xs mt-1">{{ app.call_name }}</div>
            </td>
            <td class="px-4 py-4">
              <span :class="statusColor(app.status)" class="text-[10px] px-2 py-1 rounded border font-mono uppercase whitespace-nowrap">
                {{ changingStatusId === app.id ? '...' : app.status }}
              </span>
            </td>
            <td class="px-4 py-4 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-2">
                <button @click="viewDetail(app.id)" class="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 text-slate-300 transition cursor-pointer">View</button>

                <select
                  :value="app.status === 'draft' || app.status === 'pending_revision' ? '' : app.status"
                  @change="handleStatusSelect(app.id, ($event.target as HTMLSelectElement).value)"
                  :disabled="changingStatusId === app.id || app.status === 'draft'"
                  class="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded px-2 py-1.5 cursor-pointer outline-none focus:border-slate-500 transition disabled:opacity-50"
                >
                  <option value="" disabled class="text-slate-500">
                    {{ app.status === 'draft' ? 'Draft (Read-only)' : 'Select action...' }}
                  </option>
                  
                  <option v-for="s in ALLOWED_ADMIN_ACTIONS" :key="s.value" :value="s.value" class="bg-slate-900">
                    Change to: {{ s.label }}
                  </option>

                  <option value="request_revision" class="bg-slate-900 text-purple-400 font-medium">
                    ⚠️ Return for Revision
                  </option>
                </select>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showRevisionModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 class="text-lg font-bold text-white mb-2">Return Application #{{ revisionAppId }}</h3>
        <p class="text-slate-400 text-xs mb-4">Provide clear instructions for the student regarding what needs to be fixed or updated.</p>
        
        <textarea
          v-model="revisionMessage"
          rows="4"
          placeholder="E.g., Please upload a clearer scan of your declaration, the text is unreadable..."
          class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 outline-none transition-all resize-none"
        ></textarea>

        <div class="flex justify-end gap-3 mt-4">
          <button
            @click="showRevisionModal = false"
            :disabled="revisionLoading"
            class="px-4 py-2 text-sm border border-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            @click="submitRevision"
            :disabled="revisionLoading || !revisionMessage.trim()"
            class="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-medium rounded-lg transition shadow-lg shadow-purple-950/50"
          >
            {{ revisionLoading ? 'Sending...' : 'Send to Revision' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>