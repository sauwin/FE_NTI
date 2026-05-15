<script setup lang="ts">
import { ref } from 'vue'
import api from '../../api/axios'
import { useConfirm } from '../../composables/useConfirm'

const props = defineProps<{
  users: any[]
  isSuperAdmin?: boolean
}>()
const emit = defineEmits(['refresh', 'view-user'])

const loading = ref(false)
const message = ref('')
const success = ref(false)

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

    <div class="overflow-x-auto">
      <table v-if="users.filter((u: any) => !u.roles?.some((r: any) => ['nti_admin', 'super_admin'].includes(r.slug))).length > 0" class="w-full text-sm">
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
        <tr v-for="user in users.filter(u => !u.roles?.some((r: any) => ['nti_admin', 'super_admin'].includes(r.slug)))" :key="user.id" class="border-b border-slate-800 hover:bg-slate-800/30">
          <td class="py-3 px-4">{{ user.first_name }} {{ user.last_name }}</td>
          <td class="py-3 px-4 text-slate-500">{{ user.email }}</td>
          <td class="py-3 px-4">
            <div class="flex gap-1 flex-wrap">
<span v-for="role in user.roles" :key="role.id" class="text-xs bg-blue-600/30 border border-blue-700 text-blue-300 px-2 py-1 rounded">
{{ role.slug }}
<button v-if="!['nti_admin', 'super_admin'].includes(role.slug) && isSuperAdmin !== false" @click="removeRole(user.id, role.slug)" class="ml-1 hover:text-red-400" title="Remove role">×</button>
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
            <div class="flex gap-2">
              <button @click="emit('view-user', user.id)" class="text-xs bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 px-2 py-1 rounded transition">
                View
              </button>
              <button v-if="user.status === 'active'" @click="blockUser(user.id)" :disabled="loading" class="text-xs bg-yellow-600/30 hover:bg-yellow-600/50 disabled:opacity-50 text-yellow-400 px-2 py-1 rounded transition">
                Block
              </button>
              <button v-if="isSuperAdmin" @click="deleteUser(user.id)" :disabled="loading" class="text-xs bg-red-600/30 hover:bg-red-600/50 disabled:opacity-50 text-red-400 px-2 py-1 rounded transition">
                Delete
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
      <div v-else class="text-center py-8 text-slate-500 text-sm">
        Only admin users. Super admin can manage them separately.
      </div>
    </div>
  </div>
</template>