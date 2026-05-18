<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import UserManagementPanel from '@/components/admin/UserManagementPanel.vue'
import PendingApprovalsTable from './PendingApprovalTable.vue'
import AdminLogs from './AdminLogs.vue'
import CreateAdminForm from './CreateAdminForm.vue'

// Нові компоненти для ядра Programs + Calls (їх можна винести або рендерити на місці)
import ProgramCallsManager from '@/components/admin/ProgramCallsManager.vue'

const props = defineProps<{
  userRole?: string
}>()

const activeTab = ref('overview')
const error = ref('')
const loadingStats = ref(true)
const isSuperAdmin = props.userRole === 'super_admin'

// Оптимізований об'єкт статистики за документацією (модуль Reporting / BI)
const stats = ref({
  total_users: 0,
  active_projects: 0,
  pending_approvals: 0,
  open_calls: 0
})

const users = ref([])
const pendingUsers = ref([])

// 1. Оптимізоване завантаження агрегованих метрик (без завантаження 10k юзерів)
async function loadAggregatedStats() {
  try {
    loadingStats.value = true
    const res = await api.get('/admin/reporting/dashboard-stats')
    stats.value = res.data
  } catch (e: any) {
    console.error('Failed to load aggregated stats, falling back...', e)
    // Fallback якщо ендпоінт ще не готовий
    stats.value.active_projects = 0
  } finally {
    loadingStats.value = false
  }
}

// 2. Завантаження детальних даних лише тоді, коли відкривається відповідний таб
async function loadUserData() {
  try {
    const res = await api.get('/admin/users')
    users.value = res.data
    stats.value.total_users = res.data.length // коригуємо локально
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load users'
  }
}

async function loadPendingApprovals() {
  try {
    const appRes = await api.get('/admin/approvals')
    pendingUsers.value = appRes.data
    stats.value.pending_approvals = appRes.data.length
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load approvals'
  }
}

// Слідкуємо за зміною табів, щоб не навантажувати мережу (Lazy Loading даних)
const handleTabChange = (tab: string) => {
  activeTab.value = tab
  if (tab === 'users') loadUserData()
  if (tab === 'approvals') loadPendingApprovals()
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
        <button @click="handleTabChange('users')" :class="[activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Manage Users</button>
        <button @click="handleTabChange('approvals')" :class="[activeTab === 'approvals' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Pending Approvals</button>
        <button v-if="isSuperAdmin" @click="handleTabChange('create-admin')" :class="[activeTab === 'create-admin' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Create Admin</button>
        <button @click="handleTabChange('logs')" :class="[activeTab === 'logs' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Audit Logs</button>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
      {{ error }}
    </div>

    <div v-show="activeTab === 'overview'">
      <div v-if="loadingStats" class="text-slate-400 animate-pulse">Loading dashboard metrics...</div>
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
          <div class="text-xs text-slate-500 uppercase font-mono mb-1">Pending Onboarding</div>
          <div class="text-3xl font-bold text-yellow-500">{{ stats.pending_approvals }}</div>
        </div>
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50">
          <div class="text-xs text-slate-500 uppercase font-mono mb-1">Active Open Calls</div>
          <div class="text-3xl font-bold text-blue-400">{{ stats.open_calls }}</div>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'programs-calls'">
      <ProgramCallsManager />
    </div>

    <div v-show="activeTab === 'users'">
      <UserManagementPanel :users="users" :is-super-admin="isSuperAdmin" @refresh="loadUserData" />
    </div>

    <div v-show="activeTab === 'approvals'">
      <PendingApprovalsTable :pending-users="pendingUsers" @refresh="loadPendingApprovals" />
    </div>

    <div v-show="activeTab === 'create-admin' && isSuperAdmin">
      <CreateAdminForm @created="loadAggregatedStats" />
    </div>

    <div v-show="activeTab === 'logs'">
      <AdminLogs :users="users" />
    </div>
  </div>
</template>