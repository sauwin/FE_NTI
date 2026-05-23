<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CompanyProfile from './CompanyProfile.vue'
import CompanyTasks from './CompanyTasks.vue'
import ActiveMembersTable from './ActiveMembersTable.vue'
import PendingApprovalsTable from './PendingApprovalsTable.vue'
import api from '../../../shared/api/axios'
import { useConfirm } from '../../../shared/composables/useConfirm'

type AdminTab =
  | 'company-info'
  | 'project-tasks'
  | 'members'
  | 'approvals'
  | 'applications'

interface CompanyUser {
  id: number
  first_name: string
  last_name: string
  email: string
  status?: string
  roles?: any[]
  role_slug?: string
}

const activeTab = ref<AdminTab>('company-info')
const pendingUsers = ref<CompanyUser[]>([])
const activeMembers = ref<CompanyUser[]>([])
const loadingMembers = ref(false)

const handleTabChange = (tab: AdminTab) => {
  activeTab.value = tab

  if (tab === 'members') {
    fetchMembersData()
  }
}

// Завантажує обидва списки одночасно
async function fetchMembersData() {
  loadingMembers.value = true
  try {
    const [pendingRes, activeRes] = await Promise.all([
      api.get<CompanyUser[]>('/company/members/pending'),
      api.get<CompanyUser[]>('/company/members/active')
    ])

    pendingUsers.value = Array.isArray(pendingRes.data) ? pendingRes.data : []
    activeMembers.value = Array.isArray(activeRes.data) ? activeRes.data : []
  } catch (error) {
    console.error('Failed to fetch members data', error)
  } finally {
    loadingMembers.value = false
  }
}

async function handleApprove(user: CompanyUser) {
  try {
    await api.post(`/company/members/${user.id}/approve`, {})
    await fetchMembersData()
  } catch {}
}

async function handleReject(user: CompanyUser) {
  try {
    await api.post(`/company/members/${user.id}/reject`, {})
    await fetchMembersData()
  } catch {}
}

async function handleKick(user: CompanyUser) {
  const confirmed = await useConfirm({
    title: 'Kick Member',
    message: `Are you sure you want to kick ${user.first_name} ${user.last_name} out of the company? They will become pending again.`,
    confirmText: 'Kick Out',
    cancelText: 'Cancel',
    danger: true,
  })
  
  if (!confirmed) return

  try {
    await api.delete(`/company/members/${user.id}/kick`)
    await fetchMembersData()
  } catch (error) {
    console.error('Failed to kick member', error)
  }
}

onMounted(() => {
  if (activeTab.value === 'members') {
    fetchMembersData()
  }
})
</script>

<template>
  <div class="p-6 bg-slate-950 min-h-screen text-slate-100">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-white mb-4">Company Administration</h2>
      
      <div class="flex flex-wrap gap-2 border-b border-slate-800">
        <button @click="handleTabChange('company-info')" :class="[activeTab === 'company-info' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Company Info</button>
        <button @click="handleTabChange('project-tasks')" :class="[activeTab === 'project-tasks' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Project Tasks</button>
        <button @click="handleTabChange('approvals')" :class="[activeTab === 'approvals' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Manage Pending Approvals</button>
        <button @click="handleTabChange('members')" :class="[activeTab === 'members' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Manage Company Members</button>
      </div>
    </div>

    <div v-show="activeTab === 'project-tasks'">
      <CompanyTasks />
    </div>

    <div v-show="activeTab === 'company-info'">
      <CompanyProfile />
    </div>

    <div v-show="activeTab === 'approvals'" class="space-y-10">
      <PendingApprovalsTable
        :pending-users="pendingUsers"
        :loading="loadingMembers"
        @approve="handleApprove"
        @reject="handleReject"
      />
    </div>

    <div v-show="activeTab === 'members'" class="space-y-10">
      <ActiveMembersTable
        :active-members="activeMembers"
        :loading="loadingMembers"
        @kick="handleKick"
      />
    </div>
  </div>
</template>