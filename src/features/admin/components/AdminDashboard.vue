<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { getDashboardStats, getAdminUsers, exportDashboardStats as exportDashboardStatsApi } from '@/features/admin/api/admin'
import type { DashboardStats } from '@/features/admin/types/admin'
import { useI18n } from 'vue-i18n'

const ProgramCallsManager = defineAsyncComponent(() => import('@/features/admin/components/ProgramCallsManager.vue'))
const ApplicationsManager = defineAsyncComponent(() => import('@/features/admin/components/ApplicationsManager.vue'))
const CallEvaluatorsManager = defineAsyncComponent(() => import('@/features/admin/components/CallEvaluatorsManager.vue'))
const ApplicationMentorsManager = defineAsyncComponent(() => import('@/features/admin/components/ApplicationMentorsManager.vue'))
const UserManagementPanel = defineAsyncComponent(() => import('@/features/admin/components/UserManagementPanel.vue'))
const AdminDocumentManager = defineAsyncComponent(() => import('@/features/admin/components/AdminDocumentManager.vue'))
const CreateAdminForm = defineAsyncComponent(() => import('./CreateAdminForm.vue'))
const AdminLogs = defineAsyncComponent(() => import('./AdminLogs.vue'))
const BulkNotificationPanel = defineAsyncComponent(() => import('@/features/admin/components/BulkNotificationPanel.vue'))
const OrganizationManager = defineAsyncComponent(() => import('@/features/admin/components/OrganizationManager.vue'))
const BacklogManager = defineAsyncComponent(() => import('@/features/admin/components/BacklogManager.vue'))

const props = defineProps<{
  userRole?: string
}>()

const { t } = useI18n()

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
const pendingCount = ref(0)

const quickStats = computed(() => [
  { label: t('admin.dashboard.totalUsers'), value: stats.value.total_users, color: 'text-white', border: 'border-slate-800', bg: 'bg-slate-900/40' },
  { label: t('admin.dashboard.totalCalls'), value: stats.value.total_calls, color: 'text-white', border: 'border-slate-800', bg: 'bg-slate-900/40' },
  { label: t('admin.dashboard.totalApplications'), value: stats.value.total_applications, color: 'text-white', border: 'border-slate-800', bg: 'bg-slate-900/40' },
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
    error.value = e.response?.data?.message || t('admin.dashboard.errors.metricsLoadFailed')
  } finally {
    loadingStats.value = false
  }
}

async function exportDashboardStats(format: 'csv' | 'xlsx') {
  try {
    const res = await exportDashboardStatsApi({ format })
    const url  = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href  = url
    link.setAttribute('download', `dashboard_stats_${new Date().toISOString().split('T')[0]}.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    error.value = t('admin.dashboard.errors.exportFailed')
  }
}

async function loadUserData() {
  try {
    const res = await getAdminUsers()
    users.value = res.data ?? []
  } catch (e: any) {
    error.value = e.response?.data?.message || t('admin.dashboard.errors.usersLoadFailed')
  }
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab

  if (tab === 'overview') loadAggregatedStats()
  if (tab === 'logs') loadUserData()

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
          <h2 class="text-3xl font-bold text-white">{{ t('admin.dashboard.title')}}</h2>
          <p class="text-sm text-slate-500 mt-2">
            {{ t('admin.dashboard.description')}}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button v-for="tab in [
          { id: 'overview', name: t('admin.dashboard.tabLabels.overview') },
          { id: 'programs-calls', name: t('admin.dashboard.tabLabels.programsCalls') },
          { id: 'applications', name: t('admin.dashboard.tabLabels.applications') },
          { id: 'evaluators', name: t('admin.dashboard.tabLabels.evaluators') },
          { id: 'mentorships', name: t('admin.dashboard.tabLabels.mentorships') },
          { id: 'users', name: t('admin.dashboard.tabLabels.users') },
          { id: 'organization-manager', name: t('admin.dashboard.tabLabels.company') },
          { id: 'backlog', name: t('admin.dashboard.tabLabels.backlog') },
          { id: 'documents', name: t('admin.dashboard.tabLabels.documents') },
          ...(isSuperAdmin ? [{ id: 'create-admin', name: t('admin.dashboard.tabLabels.createAdmin') }] : []),
          { id: 'logs', name: t('admin.dashboard.tabLabels.logs') },
          { id: 'broadcast-notification', name: t('admin.dashboard.tabLabels.broadcastNotification') }
        ]" 
        :key="tab.id"
        @click="handleTabChange(tab.id)"
        :class="[
          activeTab === tab.id
            ? 'bg-blue-600/15 border-blue-500 text-blue-400'
            : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
          'px-3 py-2 text-sm font-medium transition rounded-xl border'
        ]">
          {{ tab.name }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
      {{ error }}
    </div>

    <div v-if="activeTab === 'overview'" class="space-y-6">
          <!-- export buttons row, only shown when stats are loaded -->
      <div v-if="!loadingStats" class="flex justify-end gap-2">
        <button
          @click="exportDashboardStats('csv')"
          class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono"
        >{{ t('admin.dashboard.exportCsv') }}</button>
        <button
          @click="exportDashboardStats('xlsx')"
          class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono"
        >{{ t('admin.dashboard.exportXlsx') }}</button>
      </div>

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
                <h3 class="text-lg font-semibold text-white">{{ t('admin.overview.title')}}</h3>
                <p class="text-sm text-slate-500 mt-1">{{ t('admin.overview.description')}}</p>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-white">{{ t('admin.overview.openCalls.title')}}</div>
                  <div class="text-xs text-slate-500 mt-1">{{ t('admin.overview.openCalls.description') }}</div>
                </div>
                <div class="text-2xl font-bold text-white">{{ stats.open_calls }}</div>
              </div>

              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-white">{{ t('admin.overview.applicationsSubmitted.title')}}</div>
                  <div class="text-xs text-slate-500 mt-1">{{ t('admin.overview.applicationsSubmitted.description') }}</div>
                </div>
                <div class="text-2xl font-bold text-white">{{ stats.application_submitted }}</div>
              </div>

              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-white">{{ t('admin.overview.applicationsActive.title')}}</div>
                  <div class="text-xs text-slate-500 mt-1">{{ t('admin.overview.applicationsActive.description') }}</div>
                </div>
                <div class="text-2xl font-bold text-white">{{ stats.application_active }}</div>
              </div>

              <div class="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div class="text-sm text-white">{{ t('admin.overview.applicationsClosed.title')}}</div>
                  <div class="text-xs text-slate-500 mt-1">{{ t('admin.overview.applicationsClosed.description') }}</div>
                </div>
                <div class="text-2xl font-bold text-white">{{ stats.application_closed }}</div>
              </div>
            </div>
          </div>

          <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6">
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-white">{{ t('admin.overview.usersOverview.title') }}</h3>
              <p class="text-sm text-slate-500 mt-1">{{ t('admin.overview.usersOverview.description') }}</p>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between"><span class="text-sm text-white">{{ t('admin.overview.usersOverview.students') }}</span><span class="text-lg font-semibold text-white">{{ stats.students }}</span></div>
              <div class="border-t border-slate-800"></div>
              <div class="flex items-center justify-between"><span class="text-sm text-white">{{ t('admin.overview.usersOverview.companyOwners') }}</span><span class="text-lg font-semibold text-white">{{ stats.company_owners }}</span></div>
              <div class="border-t border-slate-800"></div>
              <div class="flex items-center justify-between"><span class="text-sm text-white">{{ t('admin.overview.usersOverview.administration') }}</span><span class="text-lg font-semibold text-white">{{ stats.admins }}</span></div>
              <div class="border-t border-slate-800"></div>
              <div class="flex items-center justify-between"><span class="text-sm text-white">{{ t('admin.overview.usersOverview.contentEditors') }}</span><span class="text-lg font-semibold text-white">{{ stats.content_editors }}</span></div>
              <div class="border-t border-slate-800"></div>
              <div class="flex items-center justify-between"><span class="text-sm text-white">{{ t('admin.overview.usersOverview.evaluators') }}</span><span class="text-lg font-semibold text-white">{{ stats.evaluators }}</span></div>
              <div class="border-t border-slate-800"></div>
              <div class="flex items-center justify-between"><span class="text-sm text-white">{{ t('admin.overview.usersOverview.mentors') }}</span><span class="text-lg font-semibold text-white">{{ stats.mentors }}</span></div>
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

    <div v-if="activeTab === 'organization-manager'">
      <OrganizationManager />
    </div>

    <div v-if="activeTab === 'backlog'">
      <BacklogManager />
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