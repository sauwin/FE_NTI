<script setup lang="ts">
import { ref } from 'vue'
import api from '../../api/axios'
import { useConfirm } from '../../composables/useConfirm'

const props = defineProps<{
  pendingUsers: any[]
}>()
const emit = defineEmits(['refresh'])

const loading = ref(false)
const message = ref('')
const success = ref(false)

async function approveRole(userId: number, roleName: string) {
  const confirmed = await useConfirm({
    title: 'Approve Role',
    message: `Approve "${roleName}" role for this user?`,
    confirmText: 'Approve',
    cancelText: 'Cancel',
    danger: false,
  })
  if (!confirmed) return

  loading.value = true
  try {
    await api.post(`/admin/approve/${userId}`)
    success.value = true
    message.value = `Role approved for ${roleName}`
    emit('refresh')
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || 'Failed to approve role'
  } finally {
    loading.value = false
  }
}

async function rejectRole(userId: number, roleSlug: string) {
  const confirmed = await useConfirm({
    title: 'Remove Role',
    message: `Remove "${roleSlug}" role from this user?`,
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

    <div v-if="pendingUsers.length === 0" class="text-center py-8 text-slate-500 text-sm">
      No pending approvals
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-800">
        <tr class="text-left text-slate-400">
          <th class="py-2 px-4">Name</th>
          <th class="py-2 px-4">Email</th>
          <th class="py-2 px-4">Requested Role</th>
          <th class="py-2 px-4">Created</th>
          <th class="py-2 px-4">Actions</th>
        </tr>
        </thead>
        <tbody class="text-slate-300">
        <tr v-for="user in pendingUsers" :key="`${user.id}-${user.role_slug}`" class="border-b border-slate-800 hover:bg-slate-800/30">
          <td class="py-3 px-4">{{ user.first_name }} {{ user.last_name }}</td>
          <td class="py-3 px-4 text-slate-500">{{ user.email }}</td>
          <td class="py-3 px-4">
            <span class="text-xs bg-yellow-600/30 border border-yellow-700 text-yellow-300 px-2 py-1 rounded">
            {{ user.role_slug }}
            </span>
          </td>
          <td class="py-3 px-4 text-xs text-slate-400">
            {{ new Date(user.created_at).toLocaleDateString() }}
          </td>
          <td class="py-3 px-4">
            <div class="flex gap-2">
              <button @click="approveRole(user.id, user.role_name)" :disabled="loading" class="text-xs bg-green-600/30 hover:bg-green-600/50 disabled:opacity-50 text-green-400 px-2 py-1 rounded transition">
                Approve
              </button>
              <button @click="rejectRole(user.id, user.role_slug)" :disabled="loading" class="text-xs bg-red-600/30 hover:bg-red-600/50 disabled:opacity-50 text-red-400 px-2 py-1 rounded transition">
                Reject
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>