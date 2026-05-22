<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CompanyProfile from './CompanyProfile.vue'
import CompanyTasks from './CompanyTasks.vue'
import MembersApprovalTable from './MembersApprovalTable.vue'
import api from '../../../shared/api/axios'

type AdminTab =
  | 'company-info'
  | 'project-tasks'
  | 'members'
  | 'applications'

interface PendingUser {
  id: number
  first_name: string
  last_name: string
  email: string
}

const activeTab = ref<AdminTab>('company-info')
const pendingUsers = ref<PendingUser[]>([])
const loadingMembers = ref(false)

const handleTabChange = (tab: AdminTab) => {
  activeTab.value = tab

  if (
    tab === 'members' &&
    pendingUsers.value.length === 0 &&
    !loadingMembers.value
  ) {
    fetchPendingMembers()
  }
}

async function fetchPendingMembers() {
  loadingMembers.value = true

  try {
    const response = await api.get<PendingUser[]>(
      '/company/members/pending'
    )

    pendingUsers.value = Array.isArray(response.data)
      ? response.data
      : []
  } catch {
    pendingUsers.value = []
  } finally {
    loadingMembers.value = false
  }
}

async function handleApprove(user: PendingUser) {
  try {
    await api.post(`/company/members/${user.id}/approve`, {})

    await fetchPendingMembers()
  } catch {
  }
}

async function handleReject(user: PendingUser) {
  try {
    await api.post(`/company/members/${user.id}/reject`, {})

    await fetchPendingMembers()
  } catch {
  }
}

onMounted(() => {
  if (activeTab.value === 'members') {
    fetchPendingMembers()
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
        <button @click="handleTabChange('members')" :class="[activeTab === 'members' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Manage Company Members</button>
        <button @click="handleTabChange('applications')" :class="[activeTab === 'applications' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']">Applications</button>
      </div>
    </div>

    <div v-show="activeTab === 'project-tasks'">
      <CompanyTasks />
    </div>

    <div v-show="activeTab === 'company-info'">
      <CompanyProfile />
    </div>

    <div v-show="activeTab === 'members'">
      <MembersApprovalTable
        :pending-users="pendingUsers"
        :loading="loadingMembers"
        @approve="handleApprove"
        @reject="handleReject"
      />
    </div>

    <div v-show="activeTab === 'applications'">
      No applications yet
    </div>
  </div>
</template>