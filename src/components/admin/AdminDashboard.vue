<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api/axios.ts'
import CreateAdminForm from './CreateAdminForm.vue'
import AssignRoleForm from './AssignRoleForm.vue'
import UsersList from './UsersList.vue'
import UserManagementTable from './UserManagementTable.vue'

const activeTab = ref('overview')
const stats = ref({ users: 0, activeProjects: 0, pendingApprovals: 0 })
const users = ref([])
const error = ref('')

async function loadStats() {
  try {
    const res = await api.get('/admin/users')
    users.value = res.data
    stats.value.users = res.data.length
    const appRes = await api.get('/admin/approvals')
    stats.value.pendingApprovals = appRes.data.length
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load data'
  }
}

onMounted(() => loadStats())
</script>

<template>
  <div>
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white mb-4">Admin Panel</h2>
      <div class="flex gap-2 border-b border-slate-800">
        <button @click="activeTab = 'overview'" :class="[
            'px-4 py-2 text-sm font-medium transition',
            activeTab === 'overview'? 'border-b-2 border-blue-500 text-blue-400': 'text-slate-500 hover:text-slate-400'
            ]">
          Overview
        </button>
        <button @click="activeTab = 'users'" :class="[
            'px-4 py-2 text-sm font-medium transition',
            activeTab === 'users'? 'border-b-2 border-blue-500 text-blue-400': 'text-slate-500 hover:text-slate-400']">
          Manage Users
        </button>
        <button @click="activeTab = 'create-admin'" :class="[
            'px-4 py-2 text-sm font-medium transition',
            activeTab === 'create-admin'? 'border-b-2 border-blue-500 text-blue-400': 'text-slate-500 hover:text-slate-400']">
          Create Admin
        </button>
        <button @click="activeTab = 'assign-role'" :class="[
            'px-4 py-2 text-sm font-medium transition',
            activeTab === 'assign-role'? 'border-b-2 border-blue-500 text-blue-400': 'text-slate-500 hover:text-slate-400']">
          Assign Role
        </button>
      </div>
    </div>
    <div v-if="error" class="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
      {{ error }}
    </div>
    <div v-show="activeTab === 'overview'">
      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/30">
          <div class="text-xs text-slate-500 mb-1">Total Users</div>
          <div class="text-2xl font-bold text-white">{{ stats.users }}</div>
        </div>
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/30">
          <div class="text-xs text-slate-500 mb-1">Active Projects</div>
          <div class="text-2xl font-bold text-white">{{ stats.activeProjects }}</div>
        </div>
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/30">
          <div class="text-xs text-slate-500 mb-1">Pending Approvals</div>
          <div class="text-2xl font-bold text-white">{{ stats.pendingApprovals }}</div>
        </div>
      </div>
    </div>
    <div v-show="activeTab === 'users'">
      <UserManagementTable :users="users" @refresh="loadStats" />
    </div>
    <div v-show="activeTab === 'create-admin'">
      <CreateAdminForm @created="loadStats" />
    </div>
    <div v-show="activeTab === 'assign-role'">
      <AssignRoleForm :users="users" @assigned="loadStats" />
    </div>
  </div>
</template>