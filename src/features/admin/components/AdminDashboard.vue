<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/shared/api/axios'
import UserManagementPanel from '@/features/admin/components/UserManagementPanel.vue'
import PendingApprovalsTable from './PendingApprovalTable.vue'
import AdminLogs from './AdminLogs.vue'
import CreateAdminForm from './CreateAdminForm.vue'
import AdminDocumentManager from '@/features/admin/components/AdminDocumentManager.vue'
import ProgramCallsManager from '@/features/admin/components/ProgramCallsManager.vue'
import ApplicationsManager from '@/features/admin/components/ApplicationsManager.vue'

interface DashboardStats {
  total_users: number
  active_projects: number
  pending_approvals: number
  open_calls: number
}

const props = defineProps<{
  userRole?: string
}>()

const activeTab = ref('overview')
const error = ref('')
const loadingStats = ref(true)
const isSuperAdmin = props.userRole === 'super_admin'

const selectedCallIdForApps = ref<number | null>(null)

const stats = ref<DashboardStats>({
  total_users: 0,
  active_projects: 0,
  pending_approvals: 0,
  open_calls: 0,
})

const users = ref([])
const pendingUsers = ref([])

async function loadAggregatedStats() {
  try {
    loadingStats.value = true
    const res = await api.get('/admin/reporting/dashboard-stats')
    stats.value = {
      total_users: Number(res.data.total_users ?? 0),
      active_projects: Number(res.data.active_projects ?? 0),
      pending_approvals: Number(res.data.pending_approvals ?? 0),
      open_calls: Number(res.data.open_calls ?? 0),
    }
    error.value = ''
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load dashboard metrics'
  } finally {
    loadingStats.value = false
  }
}

async function loadUserData() {
  try {
    const res = await api.get('/admin/users')
    users.value = res.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load users'
  }
}

async function loadPendingApprovals() {
  try {
    const appRes = await api.get('/admin/approvals')
    pendingUsers.value = appRes.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load approvals'
  }
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab
  if (tab === 'users') loadUserData()
  if (tab === 'approvals') loadPendingApprovals()

  if (tab !== 'applications') {
    selectedCallIdForApps.value = null
  }
}

const handleViewApplications = (callId: number) => {
  selectedCallIdForApps.value = callId
  activeTab.value = 'applications'
}



onMounted(() => {
  loadAggregatedStats()
})
</script>

<template>
  <div class="p-6 bg-slate-950 min-h-screen text-slate-100">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-white mb-4">NTI Central Administration</h2>
      
      <div class="flex flex-wrap gap-2 border-b border-slate-800">
        <button @click="handleTabChange('overview')" :class="[activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Overview</button>
        <button @click="handleTabChange('programs-calls')" :class="[activeTab === 'programs-calls' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Programs & Calls (Core)</button>
        <button @click="handleTabChange('applications')" :class="[activeTab === 'applications' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Applications</button>
        <button @click="handleTabChange('users')" :class="[activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Manage Users</button>
        <button @click="handleTabChange('approvals')" :class="[activeTab === 'approvals' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Pending Approvals</button>
        <button @click="handleTabChange('documents')" :class="[activeTab === 'documents' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Documents</button>
        <button v-if="isSuperAdmin" @click="handleTabChange('create-admin')" :class="[activeTab === 'create-admin' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Create Admin</button>
        <button @click="handleTabChange('logs')" :class="[activeTab === 'logs' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Audit Logs</button>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
      {{ error }}
    </div>

    <div v-show="activeTab === 'overview'">
      <div v-if="loadingStats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div v-for="n in 4" :key="n" class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50 animate-pulse">
          <div class="h-4 w-28 bg-slate-700 rounded mb-5"></div>
          <div class="h-12 w-24 bg-slate-800 rounded"></div>
        </div>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50">
          <div class="text-xs text-slate-500 uppercase font-mono mb-1">Total Users</div>
          <div class="text-3xl font-bold text-white">{{ stats.total_users }}</div>
        </div>
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50">
          <div class="text-xs text-slate-500 uppercase font-mono mb-1">Active Projects</div>
          <div class="text-3xl font-bold text-green-400">{{ stats.active_projects }}</div>
        </div>
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50">
          <div class="text-xs text-slate-500 uppercase font-mono mb-1">Pending Approvals</div>
          <div class="text-3xl font-bold text-yellow-500">{{ stats.pending_approvals }}</div>
        </div>
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50">
          <div class="text-xs text-slate-500 uppercase font-mono mb-1">Active Open Calls</div>
          <div class="text-3xl font-bold text-blue-400">{{ stats.open_calls }}</div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'programs-calls'">
      <ProgramCallsManager @view-applications="handleViewApplications" />
    </div>

    <div v-show="activeTab === 'applications'">
      <ApplicationsManager 
        :filter-call-id="selectedCallIdForApps" 
        @clear-filter="selectedCallIdForApps = null"
      />
    </div>

    <div v-show="activeTab === 'users'">
      <UserManagementPanel :users="users" :is-super-admin="isSuperAdmin" @refresh="loadUserData" />
    </div>

    <div v-show="activeTab === 'approvals'">
      <PendingApprovalsTable :pending-users="pendingUsers" @refresh="loadPendingApprovals" />
    </div>

    <div v-show="activeTab === 'documents'">
      <AdminDocumentManager />
    </div>

    <div v-show="activeTab === 'create-admin' && isSuperAdmin">
      <CreateAdminForm @created="loadAggregatedStats" />
    </div>

    <div v-show="activeTab === 'logs'">
      <AdminLogs :users="users" />
    </div>
  </div>
</template>