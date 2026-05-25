<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '@/shared/api/axios'
import BulkNotificationPanel from '@/features/admin/components/BulkNotificationPanel.vue'
import UserManagementPanel from '@/features/admin/components/UserManagementPanel.vue'
import PendingApprovalsTable from './PendingApprovalTable.vue'
import AdminLogs from './AdminLogs.vue'
import CreateAdminForm from './CreateAdminForm.vue'
import AdminDocumentManager from '@/features/admin/components/AdminDocumentManager.vue'
import ProgramCallsManager from '@/features/admin/components/ProgramCallsManager.vue'
import ApplicationsManager from '@/features/admin/components/ApplicationsManager.vue'
import CallEvaluatorsManager from '@/features/admin/components/CallEvaluatorsManager.vue'
import ApplicationMentorsManager from '@/features/admin/components/ApplicationMentorsManager.vue'

interface DashboardStats {
  total_users: number
  active_projects: number
  pending_approvals: number
  open_calls: number

  blocked_users?: number
  evaluators?: number
  mentors?: number
  admins?: number
  draft_calls?: number
  closed_calls?: number
  archived_calls?: number
  applications_total?: number
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

  blocked_users: 0,
  evaluators: 0,
  mentors: 0,
  admins: 0,
  draft_calls: 0,
  closed_calls: 0,
  archived_calls: 0,
  applications_total: 0,
})

const users = ref<any[]>([])
const pendingUsers = ref<any[]>([])

const quickStats = computed(() => [
  {
    label: 'Total Users',
    value: stats.value.total_users,
    color: 'text-white',
    border: 'border-slate-800',
    bg: 'bg-slate-900/50',
  },
  {
    label: 'Active Projects',
    value: stats.value.active_projects,
    color: 'text-green-400',
    border: 'border-green-900/40',
    bg: 'bg-green-950/20',
  },
  {
    label: 'Pending Approvals',
    value: stats.value.pending_approvals,
    color: 'text-yellow-400',
    border: 'border-yellow-900/40',
    bg: 'bg-yellow-950/20',
  },
  {
    label: 'Open Calls',
    value: stats.value.open_calls,
    color: 'text-blue-400',
    border: 'border-blue-900/40',
    bg: 'bg-blue-950/20',
  },
  {
    label: 'Blocked Users',
    value: stats.value.blocked_users,
    color: 'text-red-400',
    border: 'border-red-900/40',
    bg: 'bg-red-950/20',
  },
  {
    label: 'Applications',
    value: stats.value.applications_total,
    color: 'text-cyan-400',
    border: 'border-cyan-900/40',
    bg: 'bg-cyan-950/20',
  },
])

async function loadAggregatedStats() {
  try {
    loadingStats.value = true

    const res = await api.get('/admin/reporting/dashboard-stats')

    stats.value = {
      total_users: Number(res.data.total_users ?? 0),
      active_projects: Number(res.data.active_projects ?? 0),
      pending_approvals: Number(res.data.pending_approvals ?? 0),
      open_calls: Number(res.data.open_calls ?? 0),

      blocked_users: Number(res.data.blocked_users ?? 0),
      evaluators: Number(res.data.evaluators ?? 0),
      mentors: Number(res.data.mentors ?? 0),
      admins: Number(res.data.admins ?? 0),

      draft_calls: Number(res.data.draft_calls ?? 0),
      closed_calls: Number(res.data.closed_calls ?? 0),
      archived_calls: Number(res.data.archived_calls ?? 0),

      applications_total: Number(res.data.applications_total ?? 0),
    }

    error.value = ''
  } catch (e: any) {
    error.value =
      e.response?.data?.message || 'Failed to load dashboard metrics'
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
  loadUserData()
})
</script>

<template>
  <div class="p-6 bg-slate-950 min-h-screen text-slate-100">
    <div class="mb-8">
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
        <div>
          <h2 class="text-3xl font-bold text-white">
            NTI Central Administration
          </h2>

          <p class="text-sm text-slate-500 mt-2">
            Centralized management of users, applications, programs and platform workflows.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          @click="handleTabChange('overview')"
          :class="[
            activeTab === 'overview'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Overview
        </button>

        <button
          @click="handleTabChange('programs-calls')"
          :class="[
            activeTab === 'programs-calls'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Programs & Calls
        </button>

        <button
          @click="handleTabChange('applications')"
          :class="[
            activeTab === 'applications'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Applications
        </button>

        <button
          @click="handleTabChange('evaluators')"
          :class="[
            activeTab === 'evaluators'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Evaluators
        </button>

        <button
          @click="handleTabChange('mentorships')"
          :class="[
            activeTab === 'mentorships'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Mentors
        </button>

        <button
          @click="handleTabChange('users')"
          :class="[
            activeTab === 'users'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Users
        </button>

        <button
          @click="handleTabChange('approvals')"
          :class="[
            activeTab === 'approvals'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Approvals
        </button>

        <button
          @click="handleTabChange('documents')"
          :class="[
            activeTab === 'documents'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Documents
        </button>

        <button
          v-if="isSuperAdmin"
          @click="handleTabChange('create-admin')"
          :class="[
            activeTab === 'create-admin'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Create Admin
        </button>

        <button
          @click="handleTabChange('logs')"
          :class="[
            activeTab === 'logs'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Audit Logs
        </button>

        <button
          @click="handleTabChange('broadcast-notification')"
          :class="[
            activeTab === 'broadcast-notification'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Broadcast
        </button>
      </div>
    </div>

    <div
      v-if="error"
      class="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm"
    >
      {{ error }}
    </div>

    <div v-show="activeTab === 'overview'" class="space-y-6">
      <div
        v-if="loadingStats"
        class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50 animate-pulse"
        >
          <div class="h-4 w-24 bg-slate-700 rounded mb-5"></div>
          <div class="h-10 w-20 bg-slate-800 rounded mb-4"></div>
          <div class="h-3 w-full bg-slate-800 rounded"></div>
        </div>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="item in quickStats"
            :key="item.label"
            :class="[
              item.border,
              item.bg
            ]"
            class="rounded-2xl p-6 border transition hover:border-slate-700"
          >
            <div class="flex items-start justify-between mb-5">
              <div>
                <div class="text-xs text-slate-500 uppercase font-mono mb-2">
                  {{ item.label }}
                </div>

                <div :class="item.color" class="text-4xl font-bold">
                  {{ item.value }}
                </div>
              </div>
            </div>

            <div class="w-full h-1 rounded-full bg-slate-800 overflow-hidden"></div>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div class="xl:col-span-2 border border-slate-800 bg-slate-900/40 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-semibold text-white">
                  Platform Activity
                </h3>

                <p class="text-sm text-slate-500 mt-1">
                  Overview of users, programs and workflow state.
                </p>
              </div>

              <button
                @click="loadAggregatedStats"
                class="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition text-slate-300"
              >
                Refresh
              </button>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-slate-300">Draft Calls</div>
                  <div class="text-xs text-slate-500 mt-1">
                    Calls not yet published
                  </div>
                </div>

                <div class="text-2xl font-bold text-slate-300">
                  {{ stats.draft_calls }}
                </div>
              </div>

              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-slate-300">Closed Calls</div>
                  <div class="text-xs text-slate-500 mt-1">
                    Finished application periods
                  </div>
                </div>

                <div class="text-2xl font-bold text-orange-400">
                  {{ stats.closed_calls }}
                </div>
              </div>

              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-slate-300">Archived Calls</div>
                  <div class="text-xs text-slate-500 mt-1">
                    Historical archived calls
                  </div>
                </div>

                <div class="text-2xl font-bold text-slate-500">
                  {{ stats.archived_calls }}
                </div>
              </div>
            </div>
          </div>

          <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-white">
                Staff Overview
              </h3>

              <p class="text-sm text-slate-500 mt-1">
                Administrative and review team distribution.
              </p>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-400">Administrators</span>
                <span class="text-lg font-semibold text-red-400">
                  {{ stats.admins }}
                </span>
              </div>

              <div class="border-t border-slate-800"></div>

              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-400">Evaluators</span>
                <span class="text-lg font-semibold text-blue-400">
                  {{ stats.evaluators }}
                </span>
              </div>

              <div class="border-t border-slate-800"></div>

              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-400">Mentors</span>
                <span class="text-lg font-semibold text-purple-400">
                  {{ stats.mentors }}
                </span>
              </div>

              <div class="border-t border-slate-800"></div>

              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-400">Blocked Users</span>
                <span class="text-lg font-semibold text-yellow-400">
                  {{ stats.blocked_users }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
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

    <div v-show="activeTab === 'evaluators'">
      <CallEvaluatorsManager />
    </div>

    <div v-show="activeTab === 'mentorships'">
      <ApplicationMentorsManager />
    </div>

    <div v-show="activeTab === 'users'">
      <UserManagementPanel
        :users="users"
        :is-super-admin="isSuperAdmin"
        @refresh="loadUserData"
      />
    </div>

    <div v-show="activeTab === 'approvals'">
      <PendingApprovalsTable
        :pending-users="pendingUsers"
        @refresh="loadPendingApprovals"
      />
    </div>

    <div v-show="activeTab === 'documents'">
      <AdminDocumentManager />
    </div>

    <div v-show="activeTab === 'create-admin' && isSuperAdmin">
      <CreateAdminForm @created="loadAggregatedStats" />
    </div>

    <div v-show="activeTab === 'logs'">
      <AdminLogs
        :users="users.filter((u: any) =>
          u.roles?.some((r: any) =>
            ['nti_admin', 'super_admin', 'evaluator', 'content_editor'].includes(r.slug)
          )
        )"
      />
    </div>

    <div v-show="activeTab === 'broadcast-notification'">
      <BulkNotificationPanel />
    </div>
  </div>
</template>