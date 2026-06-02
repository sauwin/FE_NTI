<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  blockUser as blockUserApi,
  unblockUser as unblockUserApi,
  deleteAdminUser,
  removeUserRole,
  addUserRole,
  exportUsers as exportUsersApi,
  getAdminUsers,
} from '@/features/admin/api/admin'
import type { AdminRole } from '@/features/admin/types/admin'
import { useConfirm } from '@/shared/composables/useConfirm'
import Pagination from '@/shared/components/Pagination.vue'

defineProps<{ isSuperAdmin?: boolean }>()
const emit = defineEmits(['refresh'])

const AVAILABLE_ROLES = ['student', 'company', 'mentor']
const SUPER_ADMIN_ROLES = ['student', 'company', 'mentor', 'evaluator', 'content_editor']
const filterRoles = ['student', 'company', 'mentor', 'evaluator', 'content_editor', 'nti_admin', 'super_admin']

const roleInOrgOptions = [
  { value: 'owner', label: 'Owner' },
  { value: 'contact', label: 'Contact' },
  { value: 'evaluator', label: 'Evaluator' },
  { value: 'mentor', label: 'Mentor' },
]

const users = ref<any[]>([])
const loading = ref(false)
const message = ref('')
const success = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const searchQuery = ref('')
const selectedRole = ref('')
const selectedStatus = ref('')

const showCompanyModal = ref(false)
const companyForm = ref({
  userId: null as number | null,
  roleSlug: '',
  registration_number: '',
  role_in_org: 'contact',
})

async function loadUsers() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value }
    if (searchQuery.value) params.search = searchQuery.value
    if (selectedRole.value) params.role = selectedRole.value
    if (selectedStatus.value) params.status = selectedStatus.value
    const res = await getAdminUsers(params)
    if (res.data?.data) {
      users.value = res.data.data
      currentPage.value = res.data.current_page
      totalPages.value = res.data.last_page
      totalItems.value = res.data.total
    } else {
      users.value = Array.isArray(res.data) ? res.data : []
      totalPages.value = 1
      totalItems.value = users.value.length
    }
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || 'Failed to load users')
  } finally {
    loading.value = false
  }
}

function handleFilterChange() {
  currentPage.value = 1
  loadUsers()
}

function setMessage(ok: boolean, text: string) {
  success.value = ok
  message.value = text
  setTimeout(() => { message.value = '' }, 3000)
}

function canManage(user: any) {
  const adminOnlyRoles = ['nti_admin', 'super_admin', 'evaluator', 'content_editor']
  return !user.roles?.some((r: AdminRole) => adminOnlyRoles.includes(r.slug))
}

function getAvailableRolesToAssign(isSuperAdmin?: boolean) {
  return isSuperAdmin ? SUPER_ADMIN_ROLES : AVAILABLE_ROLES
}

function onRoleSelect(userId: number, roleSlug: string) {
  if (!roleSlug) return
  if (roleSlug === 'company') {
    companyForm.value = { userId, roleSlug, registration_number: '', role_in_org: 'contact' }
    showCompanyModal.value = true
  } else {
    assignRole(userId, roleSlug)
  }
}

async function blockUser(userId: number) {
  if (!await useConfirm({ title: 'Block User', message: 'Block this user?', confirmText: 'Block', cancelText: 'Cancel', danger: true })) return
  loading.value = true
  try {
    await blockUserApi(userId)
    setMessage(true, 'User blocked')
    emit('refresh')
    loadUsers()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || 'Failed to block user')
  } finally { loading.value = false }
}

async function unblockUser(userId: number) {
  if (!await useConfirm({ title: 'Unblock User', message: 'Unblock this user?', confirmText: 'Unblock', cancelText: 'Cancel', danger: false })) return
  loading.value = true
  try {
    await unblockUserApi(userId)
    setMessage(true, 'User unblocked')
    emit('refresh')
    loadUsers()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || 'Failed to unblock user')
  } finally { loading.value = false }
}

async function deleteUser(userId: number) {
  if (!await useConfirm({ title: 'Delete User', message: 'Delete permanently? Cannot be undone.', confirmText: 'Delete', cancelText: 'Cancel', danger: true })) return
  loading.value = true
  try {
    await deleteAdminUser(userId)
    setMessage(true, 'User deleted')
    emit('refresh')
    loadUsers()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || 'Failed to delete user')
  } finally { loading.value = false }
}

async function removeRole(userId: number, roleSlug: string) {
  if (!await useConfirm({ title: 'Remove Role', message: `Remove "${roleSlug}" role?`, confirmText: 'Remove', cancelText: 'Cancel', danger: true })) return
  loading.value = true
  try {
    await removeUserRole(userId, roleSlug)
    setMessage(true, 'Role removed')
    emit('refresh')
    loadUsers()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || 'Failed to remove role')
  } finally { loading.value = false }
}

async function assignRole(userId: number, roleSlug: string, extraData?: { registration_number: string; role_in_org: string }) {
  loading.value = true
  try {
    const user = users.value.find(u => u.id === userId)
    const currentRoles = user?.roles?.map((r: any) => r.slug) || []
    const replaceableRoles = SUPER_ADMIN_ROLES
    const rolesToRemove = currentRoles.filter((r: string) => replaceableRoles.includes(r))
    for (const role of rolesToRemove) await removeUserRole(userId, role)
    await addUserRole(userId, { role: roleSlug, ...extraData })
    setMessage(true, `Role "${roleSlug}" assigned`)
    emit('refresh')
    loadUsers()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || 'Failed to assign role')
  } finally { loading.value = false }
}

async function confirmCompanyRole() {
  if (!companyForm.value.registration_number) { setMessage(false, 'Registration number is required'); return }
  await assignRole(companyForm.value.userId!, companyForm.value.roleSlug, {
    registration_number: companyForm.value.registration_number,
    role_in_org: companyForm.value.role_in_org,
  })
  showCompanyModal.value = false
}

async function exportUsers(format: 'csv' | 'xlsx' = 'csv') {
  loading.value = true
  try {
    const response = await exportUsersApi({
      search: searchQuery.value || undefined,
      role: selectedRole.value || undefined,
      status: selectedStatus.value || undefined,
      format,
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setMessage(true, `Export successful (${format.toUpperCase()})`)
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || `Failed to export as ${format.toUpperCase()}`)
  } finally { loading.value = false }
}

onMounted(loadUsers)
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6"></div>
    
    <div v-if="message" :class="[
      'p-3 rounded-lg text-sm mb-6 border',
      success
        ? 'bg-green-900/20 border-green-800 text-green-400'
        : 'bg-red-900/20 border-red-800 text-red-400'
    ]">
      {{ message }}
    </div>

    <div class="flex flex-col gap-4 mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-xl font-bold text-white">Users Management</h3>
          <p class="text-sm text-slate-500 mt-1">
            Manage platform users, permissions and access.
          </p>
        </div>

        <div class="flex-shrink-0 gap-2 flex">
          <button
            @click="exportUsers('csv')"
            :disabled="loading"
            class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono"
          >
            Export CSV
          </button>

          <button
            @click="exportUsers('xlsx')"
            :disabled="loading"
            class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono"
          >
            Export XLSX
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center w-full">
        <div class="sm:col-span-1">
          <input
            v-model="searchQuery"
            placeholder="Search by name or email..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
          />
        </div>

        <div>
          <select
            v-model="selectedRole"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer"
          >
            <option value="">All Roles</option>
            <option
              v-for="role in filterRoles"
              :key="role"
              :value="role"
            >
              {{ role }}
            </option>
          </select>
        </div>

        <div>
          <select
            v-model="selectedStatus"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-slate-500 animate-pulse py-4 font-mono text-sm">
      Loading users...
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
          <tr>
            <th class="px-4 py-3 rounded-tl-lg">User</th>
            <th class="px-4 py-3">Roles</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3 rounded-tr-lg text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
              v-for="user in users"
            :key="user.id"
            class="border-b border-slate-800 hover:bg-slate-800/30 transition"
          >
            <td class="px-4 py-3">
              <div class="font-semibold text-white text-sm">
                {{ user.first_name }} {{ user.last_name }}
              </div>
              <div class="text-xs text-slate-500 font-mono mt-0.5">
                {{ user.email }}
<!--                {{ console.log(user) }}-->
              </div>
            </td>

            <td class="px-4 py-3">
              <div class="flex gap-1 flex-wrap items-center">
                <span
                  v-for="role in user.roles"
                  :key="role.id"
                  class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border font-mono uppercase bg-blue-900/40 text-blue-400 border-blue-800"
                >
                  {{ role.slug=='company' ? `${role.slug} (${user.role_in_org})` : role.slug }}
                  <button
                    v-if="!['nti_admin', 'super_admin'].includes(role.slug) && canManage(user)"
                    @click="removeRole(user.id, role.slug)"
                    class="hover:text-red-400 transition cursor-pointer leading-none"
                  >
                    ×
                  </button>
                </span>
              </div>
            </td>

            <td class="px-4 py-3">
              <span
                :class="user.status === 'active'
                  ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800'
                  : 'bg-yellow-900/40 text-yellow-400 border-yellow-800'"
                class="text-xs px-2 py-1 rounded border font-mono uppercase whitespace-nowrap"
              >
                {{ user.status }}
              </span>
            </td>

            <td class="px-4 py-3 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="user.status === 'active' && canManage(user)"
                  @click="blockUser(user.id)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-400 border-yellow-800 transition disabled:opacity-50 cursor-pointer"
                >
                  Block
                </button>

                <button
                  v-if="user.status === 'blocked' && canManage(user)"
                  @click="unblockUser(user.id)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-green-900/40 hover:bg-green-900/60 text-green-400 border-green-800 transition disabled:opacity-50 cursor-pointer"
                >
                  Unblock
                </button>

                <button
                  v-if="isSuperAdmin"
                  @click="deleteUser(user.id)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-red-900/40 hover:bg-red-900/60 text-red-400 border-red-800 transition disabled:opacity-50 cursor-pointer"
                >
                  Delete
                </button>

                <select
                  v-if="canManage(user)"
                  value=""
                  @change="onRoleSelect(user.id, ($event.target as HTMLSelectElement).value)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 border-blue-800 cursor-pointer outline-none transition disabled:opacity-50"
                >
                  <option value="" disabled selected class="bg-slate-900 text-slate-300">Assign Role</option>
                  <option
                    v-for="role in getAvailableRolesToAssign(isSuperAdmin)"
                    :key="role"
                    :value="role"
                    class="bg-slate-900 text-slate-300"
                  >
                    {{ role }}
                  </option>
                </select>
              </div>
            </td>
          </tr>

          <tr v-if="users.length === 0">
            <td colspan="4" class="px-4 py-10 text-center text-slate-500 italic text-sm">
              No users found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :loading="loading"
        @change="(p) => { currentPage = p; loadUsers() }"
        class="mt-6"
    />

  <div v-if="showCompanyModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
      <h3 class="text-xl font-bold text-white mb-2">Company Role Details</h3>
      <p class="text-slate-400 text-sm mb-6">Please provide organization details to assign this role.</p>

      <div class="space-y-5">
        <div>
          <label class="block text-xs font-mono uppercase text-slate-500 mb-2">Registration Number</label>
          <input 
            v-model="companyForm.registration_number"
            type="text"
            placeholder="Enter organization ID/Code..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600 transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-500 mb-2">Role within Organization</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              v-for="opt in roleInOrgOptions" 
              :key="opt.value"
              @click="companyForm.role_in_org = opt.value"
              type="button"
              :class="[
                'px-3 py-2 text-xs font-mono uppercase border rounded-lg transition-all',
                companyForm.role_in_org === opt.value 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="flex gap-3 mt-8">
        <button 
          @click="showCompanyModal = false"
          type="button"
          class="flex-1 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          Cancel
        </button>
        <button 
          @click="confirmCompanyRole"
          type="button"
          :disabled="!companyForm.registration_number || loading"
          class="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-900/20"
        >
          {{ loading ? 'Processing...' : 'Confirm Assign' }}
        </button>
      </div>
    </div>
  </div>
</template>