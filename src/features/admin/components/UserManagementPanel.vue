<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '../../../shared/api/axios'
import { useConfirm } from '../../../shared/composables/useConfirm'

const USERS_PER_PAGE = 25

const props = defineProps<{
  users: any[]
  isSuperAdmin?: boolean
}>()
const emit = defineEmits(['refresh'])

const searchQuery = ref('')
const selectedRole = ref('')
const loading = ref(false)
const message = ref('')
const success = ref(false)
const showRoleMenu = ref<number | null>(null)
const currentPage = ref(1)

const availableRoles = [
  'student',
  'company',
  'mentor',
  'evaluator',
  'content_editor'
]

const filterRoles = [
  'student',
  'company',
  'mentor',
  'evaluator',
  'content_editor',
  'nti_admin',
  'super_admin'
]

const filtered = computed(() => {
  let result = props.users

  if (!props.isSuperAdmin) {
    result = result.filter(u => !u.roles?.some(r => ['nti_admin', 'super_admin'].includes(r.slug)))
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(u =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
  }

  if (selectedRole.value) {
    result = result.filter(u =>
        u.roles?.some(r => r.slug === selectedRole.value)
    )
  }

  return result
})

const totalPages = computed(() => Math.ceil(filtered.value.length / USERS_PER_PAGE))

const visibleUsers = computed(() => {
  const start = (currentPage.value - 1) * USERS_PER_PAGE
  return filtered.value.slice(start, start + USERS_PER_PAGE)
})

function canManage(user: any) {
  const hasAdminRole = user.roles?.some(r => ['nti_admin', 'super_admin'].includes(r.slug))
  return !hasAdminRole || props.isSuperAdmin
}

function getAvailableRolesToAssign(user: any) {
  const userRoles = user.roles?.map(r => r.slug) || []
  return availableRoles.filter(r => !userRoles.includes(r))
}

async function blockUser(userId: number) {
  const confirmed = await useConfirm({
    title: 'Block User',
    message: 'Block this user? They will not be able to access the platform.',
    confirmText: 'Block',
    cancelText: 'Cancel',
    danger: true,
  })
  if (!confirmed) return

  loading.value = true
  try {
    await api.post(`/admin/block/${userId}`)
    success.value = true
    message.value = 'User blocked'
    emit('refresh')
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || 'Failed to block user'
  } finally {
    loading.value = false
  }
}

async function unblockUser(userId: number) {
  const confirmed = await useConfirm({
    title: 'Unblock User',
    message: 'Unblock this user? They will be able to access the platform.',
    confirmText: 'Unblock',
    cancelText: 'Cancel',
    danger: false,
  })
  if (!confirmed) return

  loading.value = true
  try {
    await api.post(`/admin/unblock/${userId}`)
    success.value = true
    message.value = 'User unblocked'
    emit('refresh')
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || 'Failed to unblock user'
  } finally {
    loading.value = false
  }
}

async function deleteUser(userId: number) {
  const confirmed = await useConfirm({
    title: 'Delete User',
    message: 'Delete this user permanently? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true,
  })
  if (!confirmed) return

  loading.value = true
  try {
    await api.delete(`/admin/users/${userId}`)
    success.value = true
    message.value = 'User deleted'
    emit('refresh')
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || 'Failed to delete user'
  } finally {
    loading.value = false
  }
}

async function removeRole(userId: number, roleSlug: string) {
  const confirmed = await useConfirm({
    title: 'Remove Role',
    message: `Remove the "${roleSlug}" role from this user?`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
    danger: true,
  })
  if (!confirmed) return

  loading.value = true
  try {
    await api.delete(`/admin/users/${userId}/roles`, {
      data: { role: roleSlug }
    })
    success.value = true
    message.value = 'Role removed'
    emit('refresh')
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || 'Failed to remove role'
  } finally {
    loading.value = false
  }
}

async function assignRole(userId: number, roleSlug: string) {
  loading.value = true
  try {
    await api.post(`/admin/users/${userId}/roles`, {
      role: roleSlug
    })
    success.value = true
    message.value = `Role "${roleSlug}" assigned`
    showRoleMenu.value = null
    emit('refresh')
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || 'Failed to assign role'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="message" :class="[
'p-3 rounded-lg text-sm mb-4',
success
? 'bg-green-900/20 border border-green-800 text-green-400'
: 'bg-red-900/20 border border-red-800 text-red-400'
]">
      {{ message }}
    </div>

    <div class="mb-6 space-y-4">
      <div>
        <label class="text-sm text-slate-400 mb-2 block">Search by name or email</label>
        <input v-model="searchQuery" type="text" placeholder="Type name or email..." class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>

      <div>
        <label class="text-sm text-slate-400 mb-2 block">Filter by role</label>
        <select v-model="selectedRole" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
          <option value="">All roles</option>
          <option v-for="role in filterRoles" :key="role" :value="role">
            {{ role }}
          </option>
        </select>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table v-if="visibleUsers.length > 0" class="w-full text-sm">
        <thead class="border-b border-slate-800">
        <tr class="text-left text-slate-400">
          <th class="py-2 px-4">Name</th>
          <th class="py-2 px-4">Email</th>
          <th class="py-2 px-4">Roles</th>
          <th class="py-2 px-4">Status</th>
          <th class="py-2 px-4">Actions</th>
        </tr>
        </thead>
        <tbody class="text-slate-300">
        <tr v-for="user in visibleUsers" :key="user.id" class="border-b border-slate-800 hover:bg-slate-800/30">
          <td class="py-3 px-4">{{ user.first_name }} {{ user.last_name }}</td>
          <td class="py-3 px-4 text-slate-500">{{ user.email }}</td>
          <td class="py-3 px-4">
            <div class="flex gap-1 flex-wrap items-center">
<span v-for="role in user.roles" :key="role.id" class="text-xs bg-blue-600/30 border border-blue-700 text-blue-300 px-2 py-1 rounded">
{{ role.slug }}
<button v-if="!['nti_admin', 'super_admin'].includes(role.slug) && isSuperAdmin" @click="removeRole(user.id, role.slug)" class="ml-1 hover:text-red-400" title="Remove role">×</button>
</span>
            </div>
          </td>
          <td class="py-3 px-4">
<span :class="[
'text-xs px-2 py-1 rounded',
user.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
]">{{ user.status }}</span>
          </td>
          <td class="py-3 px-4">
            <div class="flex gap-2 flex-wrap">
              <button v-if="user.status === 'active' && canManage(user)" @click="blockUser(user.id)" :disabled="loading" class="text-xs bg-yellow-600/30 hover:bg-yellow-600/50 disabled:opacity-50 text-yellow-400 px-2 py-1 rounded transition">
                Block
              </button>
              <button v-if="user.status === 'blocked' && canManage(user)" @click="unblockUser(user.id)" :disabled="loading" class="text-xs bg-green-600/30 hover:bg-green-600/50 disabled:opacity-50 text-green-400 px-2 py-1 rounded transition">
                Unblock
              </button>
              <button v-if="isSuperAdmin" @click="deleteUser(user.id)" :disabled="loading" class="text-xs bg-red-600/30 hover:bg-red-600/50 disabled:opacity-50 text-red-400 px-2 py-1 rounded transition">
                Delete
              </button>

              <div v-if="getAvailableRolesToAssign(user).length > 0" class="relative">
                <button @click="showRoleMenu = showRoleMenu === user.id ? null : user.id" class="text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-400 px-2 py-1 rounded transition">
                  + Role
                </button>
                <div v-if="showRoleMenu === user.id" class="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 min-w-max">
                  <button v-for="role in getAvailableRolesToAssign(user)" :key="role" @click="assignRole(user.id, role)" :disabled="loading" class="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-300 text-xs border-b border-slate-700 last:border-b-0 transition disabled:opacity-50">
                    {{ role }}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
      <div v-else class="text-center py-8 text-slate-500 text-sm">
        No users found
      </div>
    </div>

    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-2">
      <button v-if="currentPage > 1" @click="currentPage--" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded transition">
        ← Prev
      </button>
      <div class="text-sm text-slate-400">
        Page {{ currentPage }} of {{ totalPages }} ({{ filtered.length }} users)
      </div>
      <button v-if="currentPage < totalPages" @click="currentPage++" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded transition">
        Next →
      </button>
    </div>
  </div>
</template>