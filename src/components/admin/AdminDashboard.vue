<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api/axios'
import CreateAdminForm from './CreateAdminForm.vue'
import AssignRoleForm from './AssignRoleForm.vue'
import UsersList from './UsersList.vue'
import UserManagementTable from './UserManagementTable.vue'

const props = defineProps<{
  userRole?: string
}>()

const activeTab = ref('overview')
const stats = ref({ users: 0, activeProjects: 0, pendingApprovals: 0 })
const users = ref([])
const error = ref('')
const isSuperAdmin = props.userRole === 'super_admin'
const selectedUserProfile = ref<any>(null)
const showUserProfile = ref(false)

async function viewUserProfile(userId: number) {
  try {
    const res = await api.get(`/admin/users/${userId}`)
    selectedUserProfile.value = res.data
    showUserProfile.value = true
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load user profile'
  }
}

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
activeTab === 'overview'
? 'border-b-2 border-blue-500 text-blue-400'
: 'text-slate-500 hover:text-slate-400'
]">Overview</button>
        <button @click="activeTab = 'users'" :class="[
'px-4 py-2 text-sm font-medium transition',
activeTab === 'users'
? 'border-b-2 border-blue-500 text-blue-400'
: 'text-slate-500 hover:text-slate-400'
]">Manage Users</button>
        <button v-if="isSuperAdmin" @click="activeTab = 'create-admin'" :class="[
'px-4 py-2 text-sm font-medium transition',
activeTab === 'create-admin'
? 'border-b-2 border-blue-500 text-blue-400'
: 'text-slate-500 hover:text-slate-400'
]">Create Admin</button>
        <button @click="activeTab = 'assign-role'" :class="[
'px-4 py-2 text-sm font-medium transition',
activeTab === 'assign-role'
? 'border-b-2 border-blue-500 text-blue-400'
: 'text-slate-500 hover:text-slate-400'
]">Assign Role</button>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
      {{ error }}
    </div>

    <!-- Overview Tab -->
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

    <!-- Users Tab -->
    <div v-show="activeTab === 'users'">
      <UserManagementTable :users="users" :is-super-admin="isSuperAdmin" @refresh="loadStats" @view-user="viewUserProfile" />
    </div>

    <!-- Create Admin Tab -->
    <div v-show="activeTab === 'create-admin' && isSuperAdmin">
      <CreateAdminForm @created="loadStats" />
    </div>

    <!-- Assign Role Tab -->
    <div v-show="activeTab === 'assign-role'">
      <AssignRoleForm :users="users" @assigned="loadStats" />
    </div>

    <!-- User Profile Modal -->
    <div v-if="showUserProfile" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center">
          <h2 class="text-xl font-bold text-white">User Profile</h2>
          <button @click="showUserProfile = false" class="text-slate-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div v-if="selectedUserProfile" class="p-6 space-y-6">
          <!-- User Info -->
          <div class="border border-slate-800 rounded-lg p-4">
            <div class="text-sm text-slate-500 mb-3">Basic Info</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-slate-400">Name:</span> <span class="text-white">{{ selectedUserProfile.user.first_name }} {{ selectedUserProfile.user.last_name }}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Email:</span> <span class="text-white">{{ selectedUserProfile.user.email }}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Status:</span> <span class="text-white">{{ selectedUserProfile.user.status }}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Created:</span> <span class="text-white">{{ new Date(selectedUserProfile.user.created_at).toLocaleDateString() }}</span></div>
              <div class="flex justify-between items-start"><span class="text-slate-400">Roles:</span>
                <div class="flex gap-1 flex-wrap justify-end">
                  <span v-for="role in selectedUserProfile.user.roles" :key="role.id" class="text-xs bg-blue-600/30 border border-blue-700 text-blue-300 px-2 py-1 rounded">{{ role.slug }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Student Profile -->
          <div v-if="selectedUserProfile.student_profile" class="border border-slate-800 rounded-lg p-4">
            <div class="text-sm text-slate-500 mb-3">Student Profile</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-slate-400">Program:</span> <span class="text-white">{{ selectedUserProfile.student_profile.study_program }}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Year:</span> <span class="text-white">{{ selectedUserProfile.student_profile.year_of_study }}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">University:</span> <span class="text-white">{{ selectedUserProfile.student_profile.university || '—' }}</span></div>
            </div>
          </div>

          <!-- Mentor Profile -->
          <div v-if="selectedUserProfile.mentor_profile" class="border border-slate-800 rounded-lg p-4">
            <div class="text-sm text-slate-500 mb-3">Mentor Profile</div>
            <div class="text-sm text-white">{{ selectedUserProfile.mentor_profile.bio || 'No bio' }}</div>
          </div>

          <!-- Company Profile -->
          <div v-if="selectedUserProfile.company_profile" class="border border-slate-800 rounded-lg p-4">
            <div class="text-sm text-slate-500 mb-3">Company Profile</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-slate-400">Name:</span> <span class="text-white">{{ selectedUserProfile.company_profile.name }}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">ICO:</span> <span class="text-white">{{ selectedUserProfile.company_profile.ico || '—' }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>