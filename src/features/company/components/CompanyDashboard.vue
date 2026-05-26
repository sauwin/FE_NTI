<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CompanyProfile from './CompanyProfile.vue'
import CompanyTasks from './CompanyTasks.vue'
import ActiveMembersTable from './ActiveMembersTable.vue'
import PendingApprovalsTable from './PendingApprovalsTable.vue'
import {
  getPendingMembers,
  getActiveMembers,
  approveMember,
  rejectMember,
  kickMember,
} from '@/features/company/api/company'
import type { CompanyUser } from '@/features/company/types/company'
import { useConfirm } from '../../../shared/composables/useConfirm'

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

// Завантажує обидва списки одночасно
async function fetchMembersData() {
  loadingMembers.value = true
  try {
    const [pendingRes, activeRes] = await Promise.all([
      getPendingMembers(),
      getActiveMembers(),
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
    await approveMember(user.id)
    await fetchMembersData()
  } catch {}
}

async function handleReject(user: CompanyUser) {
  try {
    await rejectMember(user.id)
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
    await kickMember(user.id)
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
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
        <div>
          <h2 class="text-3xl font-bold text-white">Company Administration</h2>
          <p class="text-sm text-slate-500 mt-2">
            Manage company profile, track project tasks, and moderate organization members.
          </p>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button 
          @click="handleTabChange('company-info')" 
          :class="[
            activeTab === 'company-info' 
              ? 'bg-blue-600/15 border-blue-500 text-blue-400' 
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Company Info
        </button>
        
        <button 
          @click="handleTabChange('project-tasks')" 
          :class="[
            activeTab === 'project-tasks' 
              ? 'bg-blue-600/15 border-blue-500 text-blue-400' 
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Project Tasks
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
          Manage Pending Approvals
        </button>
        
        <button 
          @click="handleTabChange('members')" 
          :class="[
            activeTab === 'members' 
              ? 'bg-blue-600/15 border-blue-500 text-blue-400' 
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          Manage Company Members
        </button>
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