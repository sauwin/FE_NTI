<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { getDashboardStats, getAdminUsers, getPendingApprovals } from '@/features/admin/api/admin'
import type { DashboardStats } from '@/features/admin/types/admin'

const ProgramCallsManager = defineAsyncComponent(() => import('@/features/admin/components/ProgramCallsManager.vue'))
const ApplicationsManager = defineAsyncComponent(() => import('@/features/admin/components/ApplicationsManager.vue'))
const CallEvaluatorsManager = defineAsyncComponent(() => import('@/features/admin/components/CallEvaluatorsManager.vue'))
const ApplicationMentorsManager = defineAsyncComponent(() => import('@/features/admin/components/ApplicationMentorsManager.vue'))
const UserManagementPanel = defineAsyncComponent(() => import('@/features/admin/components/UserManagementPanel.vue'))
const PendingApprovalsTable = defineAsyncComponent(() => import('./PendingApprovalTable.vue'))
const AdminDocumentManager = defineAsyncComponent(() => import('@/features/admin/components/AdminDocumentManager.vue'))
const CreateAdminForm = defineAsyncComponent(() => import('./CreateAdminForm.vue'))
const AdminLogs = defineAsyncComponent(() => import('./AdminLogs.vue'))
const BulkNotificationPanel = defineAsyncComponent(() => import('@/features/admin/components/BulkNotificationPanel.vue'))

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
  students: 0,
  company_owners: 0,
  admins: 0,
  content_editors: 0,
  evaluators: 0,
  mentors: 0,
  total_calls: 0,
  open_calls: 0,
  total_applications: 0,
  application_submitted: 0,
  application_active: 0,
  application_closed: 0,
})

const users = ref<any[]>([])
const pendingUsers = ref<any[]>([])

const quickStats = computed(() => [
  { label: 'Total Users', value: stats.value.total_users, color: 'text-white', border: 'border-slate-800', bg: 'bg-slate-900/40' },
  { label: 'Total Calls', value: stats.value.total_calls, color: 'text-white', border: 'border-slate-800', bg: 'bg-slate-900/40' },
  { label: 'Total Applications', value: stats.value.total_applications, color: 'text-white', border: 'border-slate-800', bg: 'bg-slate-900/40' },
])

async function loadAggregatedStats() {
  try {
    loadingStats.value = true
    const res = await getDashboardStats()
    stats.value = {
      total_users: Number(res.data?.total_users ?? 0),
      students: Number(res.data?.students ?? 0),
      company_owners: Number(res.data?.company_owners ?? 0),
      admins: Number(res.data?.admins ?? 0),
      content_editors: Number(res.data?.content_editors ?? 0),
      evaluators: Number(res.data?.evaluators ?? 0),
      mentors: Number(res.data?.mentors ?? 0),
      total_calls: Number(res.data?.total_calls ?? 0),
      open_calls: Number(res.data?.open_calls ?? 0),
      total_applications: Number(res.data?.total_applications ?? 0),
      application_submitted: Number(res.data?.application_submitted ?? 0),
      application_active: Number(res.data?.application_active ?? 0),
      application_closed: Number(res.data?.application_closed ?? 0),
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
    const res = await getAdminUsers()
    users.value = res.data ?? []
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load users'
  }
}

async function loadPendingApprovals() {
  try {
    const appRes = await getPendingApprovals()
    pendingUsers.value = appRes.data ?? []
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load approvals'
  }
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab

  if (tab === 'overview') loadAggregatedStats()
  if (tab === 'logs') loadUserData()
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
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
        <div>
          <h2 class="text-3xl font-bold text-white">NTI Central Administration</h2>
          <p class="text-sm text-slate-500 mt-2">
            Centralized management of users, applications, programs and platform workflows.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button v-for="tab in [
          { id: 'overview', name: 'Overview' },
          { id: 'programs-calls', name: 'Programs & Calls' },
          { id: 'applications', name: 'Applications' },
          { id: 'evaluators', name: 'Evaluators' },
          { id: 'mentorships', name: 'Mentors' },
          { id: 'users', name: 'Users' },
          { id: 'approvals', name: 'Approvals' },
          { id: 'documents', name: 'Documents' },
          ...(isSuperAdmin ? [{ id: 'create-admin', name: 'Create Admin' }] : []),
          { id: 'logs', name: 'Audit Logs' },
          { id: 'broadcast-notification', name: 'Broadcast' }
        ]" 
        :key="tab.id"
        @click="handleTabChange(tab.id)"
        :class="[
          activeTab === tab.id
            ? 'bg-blue-600/15 border-blue-500 text-blue-400'
            : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
          'px-4 py-2 text-sm font-medium transition rounded-xl border'
        ]">
          {{ tab.name }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
      {{ error }}
    </div>

    <div v-if="activeTab === 'overview'" class="space-y-6">
      <div v-if="loadingStats" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div v-for="n in 3" :key="n" class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50 animate-pulse">
          <div class="h-4 w-24 bg-slate-700 rounded mb-5"></div>
          <div class="h-10 w-20 bg-slate-800 rounded mb-4"></div>
          <div class="h-3 w-full bg-slate-800 rounded"></div>
        </div>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="item in quickStats" :key="item.label" :class="[item.border, item.bg]" class="rounded-2xl p-6 border transition hover:border-slate-700">
            <div class="flex items-start justify-between mb-5">
              <div>
                <div class="text-xs text-slate-500 uppercase font-mono mb-2">{{ item.label }}</div>
                <div :class="item.color" class="text-4xl font-bold">{{ item.value }}</div>
              </div>
            </div>
            <div class="w-full h-1 rounded-full bg-slate-800 overflow-hidden"></div>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div class="xl:col-span-2 border border-slate-800 bg-slate-900/40 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-semibold text-white">Platform Activity</h3>
                <p class="text-sm text-slate-500 mt-1">Overview of programs and workflow state.</p>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-white">Open calls</div>
                  <div class="text-xs text-slate-500 mt-1">Currently open calls</div>
                </div>
                <div class="text-2xl font-bold text-white">{{ stats.open_calls }}</div>
              </div>

              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-white">Applications submitted</div>
                  <div class="text-xs text-slate-500 mt-1">Applications submitted for review</div>
                </div>
                <div class="text-2xl font-bold text-white">{{ stats.application_submitted }}</div>
              </div>

              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-white">Applications active</div>
                  <div class="text-xs text-slate-500 mt-1">The application is currently under development</div>
                </div>
                <div class="text-2xl font-bold text-white">{{ stats.application_active }}</div>
              </div>

              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-white">Applications closed</div>
                  <div class="text-xs text-slate-500 mt-1">Historical archived applications</div>
                </div>
                <div class="text-2xl font-bold text-white">{{ stats.application_closed }}</div>
              </div>
            </div>
          </div>

          <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-white">Users Overview</h3>
              <p class="text-sm text-slate-500 mt-1">Distribution of Administrative and User Groups</p>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between"><span class="text-sm text-white">Students</span><span class="text-lg font-semibold text-white">{{ stats.students }}</span></div>
              <div class="border-t border-slate-800"></div>
              <div class="flex items-center justify-between"><span class="text-sm text-white">Company owners</span><span class="text-lg font-semibold text-white">{{ stats.company_owners }}</span></div>
              <div class="border-t border-slate-800"></div>
              <div class="flex items-center justify-between"><span class="text-sm text-white">Administration</span><span class="text-lg font-semibold text-white">{{ stats.admins }}</span></div>
              <div class="border-t border-slate-800"></div>
              <div class="flex items-center justify-between"><span class="text-sm text-white">Content editors</span><span class="text-lg font-semibold text-white">{{ stats.content_editors }}</span></div>
              <div class="border-t border-slate-800"></div>
              <div class="flex items-center justify-between"><span class="text-sm text-white">Evaluators</span><span class="text-lg font-semibold text-white">{{ stats.evaluators }}</span></div>
              <div class="border-t border-slate-800"></div>
              <div class="flex items-center justify-between"><span class="text-sm text-white">Mentors</span><span class="text-lg font-semibold text-white">{{ stats.mentors }}</span></div>
              <div class="border-t border-slate-800"></div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="activeTab === 'programs-calls'">
      <ProgramCallsManager @view-applications="handleViewApplications" />
    </div>

    <div v-if="activeTab === 'applications'">
      <ApplicationsManager :filter-call-id="selectedCallIdForApps" @clear-filter="selectedCallIdForApps = null" />
    </div>

    <div v-if="activeTab === 'evaluators'">
      <CallEvaluatorsManager />
    </div>

    <div v-if="activeTab === 'mentorships'">
      <ApplicationMentorsManager />
    </div>

    <div v-if="activeTab === 'users'">
      <UserManagementPanel :is-super-admin="isSuperAdmin" @refresh="loadUserData" />
    </div>

    <div v-if="activeTab === 'approvals'">
      <PendingApprovalsTable :pending-users="pendingUsers" @refresh="loadPendingApprovals" />
    </div>

    <div v-if="activeTab === 'documents'">
      <AdminDocumentManager />
    </div>

    <div v-if="activeTab === 'create-admin' && isSuperAdmin">
      <CreateAdminForm @created="loadAggregatedStats" />
    </div>

    <div v-if="activeTab === 'logs'">
      <AdminLogs />
    </div>

    <div v-if="activeTab === 'broadcast-notification'">
      <BulkNotificationPanel />
    </div>
  </div>
</template>