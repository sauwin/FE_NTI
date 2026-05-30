<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import CompanyProfile from './CompanyProfile.vue'
import CompanyTasks from './CompanyTasks.vue'
import ActiveMembersTable from './ActiveMembersTable.vue'
import PendingApprovalsTable from './PendingApprovalsTable.vue'
import OrganizationApplications from './OrganizationApplications.vue'

import {
  getPendingMembers,
  getActiveMembers,
  approveMember,
  rejectMember,
  kickMember,
} from '@/features/company/api/company'
import type { CompanyUser } from '@/features/company/types/company'
import { useConfirm as confirm } from '../../../shared/composables/useConfirm'

const props = defineProps<{
  roleInOrg?: string
}>()

type AdminTab =
  | 'company-info'
  | 'project-tasks'
  | 'members'
  | 'approvals'
  | 'applications'

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

async function fetchMembersData() {
  loadingMembers.value = true
  try {
    const [pRes, aRes] = await Promise.all([getPendingMembers(), getActiveMembers()])
    pendingUsers.value = pRes.data || []
    activeMembers.value = aRes.data || []
  } catch (e) { console.error(e) } {
    loadingMembers.value = false
  }
}

async function handleApprove(user: CompanyUser) {
  const ok = await confirm({ 
    title: 'Approve Member', 
    message: `Are you sure you want to approve ${user.first_name}?` 
  })
  if (!ok) return

  try {
    await approveMember(user.id)
    fetchMembersData()
  } catch (e) { console.error(e) }
}

async function handleReject(user: CompanyUser) {
  const ok = await confirm({ 
    title: 'Reject Request', 
    message: `Reject request from ${user.first_name}?`, 
    confirmText: 'Reject', 
    danger: true,
  })
  if (!ok) return

  try {
    await rejectMember(user.id)
    fetchMembersData()
  } catch (e) { console.error(e) }
}

async function handleKick(user: CompanyUser) {
  const ok = await confirm({ 
    title: 'Remove Member', 
    message: `Remove ${user.first_name} from organization?`, 
    confirmText: 'Remove', 
    danger: true, 
  })
  if (!ok) return

  try {
    await kickMember(user.id)
    fetchMembersData()
  } catch (e) { console.error(e) }
}

onMounted(() => {
  if (props.roleInOrg === 'owner') {
    fetchMembersData()
  }
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
      <div class="flex flex-wrap gap-2">
        <button @click="handleTabChange('company-info')" :class="[activeTab === 'company-info' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Company Profile
        </button>
        
        <button @click="handleTabChange('project-tasks')" :class="[activeTab === 'project-tasks' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Project Tasks
        </button>

        <button @click="handleTabChange('approvals')" v-if="roleInOrg === 'owner'" :class="[activeTab === 'approvals' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Manage Pending Approvals
        </button>
        
        <button @click="handleTabChange('members')" v-if="roleInOrg === 'owner'" :class="[activeTab === 'members' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Manage Company Members
        </button>

        <button @click="handleTabChange('applications')" v-if="roleInOrg === 'owner'" :class="[activeTab === 'applications' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Manage Applications
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'project-tasks'"><CompanyTasks /></div>
    <div v-show="activeTab === 'company-info'"><CompanyProfile /></div>

    <div v-show="activeTab === 'approvals' && roleInOrg === 'owner'" class="space-y-10">
      <PendingApprovalsTable :pending-users="pendingUsers" :loading="loadingMembers" @approve="handleApprove" @reject="handleReject" />
    </div>

    <div v-show="activeTab === 'members' && roleInOrg === 'owner'">
      <ActiveMembersTable :active-members="activeMembers" :loading="loadingMembers" @kick="handleKick" @refresh="fetchMembersData" />
    </div>

    <div v-show="activeTab === 'applications' && roleInOrg === 'owner'">
      <OrganizationApplications />
    </div>
  </div>
</template>