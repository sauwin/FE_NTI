<script setup lang="ts">
import { ref } from 'vue'
import { approveUser, removeUserRole } from '@/features/admin/api/admin'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  pendingUsers: any[]
}>()
const emit = defineEmits(['refresh'])

const loading = ref(false)
const message = ref('')
const success = ref(false)

async function approveRole(userId: number, roleName: string) {
  const confirmed = await useConfirm({
    title: t('admin.pendingApprovalTable.modals.approve.title'),
    message: t('admin.pendingApprovalTable.modals.approve.message', { role: roleName }),
    confirmText: t('admin.pendingApprovalTable.modals.approve.confirm'),
    cancelText: t('admin.pendingApprovalTable.modals.approve.cancel'),
    danger: false,
  })
  if (!confirmed) return

  loading.value = true
  try {
    await approveUser(userId)
    success.value = true
    message.value = t('admin.pendingApprovalTable.messages.approveSuccess', { role: roleName })
    emit('refresh')
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || t('admin.pendingApprovalTable.messages.approveFailed')
  } finally {
    loading.value = false
  }
}

async function rejectRole(userId: number, roleSlug: string) {
  const confirmed = await useConfirm({
    title: t('admin.pendingApprovalTable.modals.reject.title'),
    message: t('admin.pendingApprovalTable.modals.reject.message', { role: roleSlug }),
    confirmText: t('admin.pendingApprovalTable.modals.reject.confirm'),
    cancelText: t('admin.pendingApprovalTable.modals.reject.cancel'),
    danger: true,
  })
  if (!confirmed) return

  loading.value = true
  try {
    await removeUserRole(userId, roleSlug)
    success.value = true
    message.value = t('admin.pendingApprovalTable.messages.rejectSuccess')
    emit('refresh')
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || t('admin.pendingApprovalTable.messages.rejectFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    <div v-if="message" :class="[
      'p-3 rounded-lg text-sm mb-4',
      success
      ? 'bg-green-900/20 border border-green-800 text-green-400'
      : 'bg-red-900/20 border border-red-800 text-red-400'
      ]">
      {{ message }}
    </div>

    <div v-if="pendingUsers.length === 0" class="text-center py-8 text-slate-500 text-sm">
      {{ t('admin.pendingApprovalTable.emptyState') }}
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-800">
        <tr class="text-left text-slate-400">
          <th class="py-2 px-4">{{ t('admin.pendingApprovalTable.table.headers.name') }}</th>
          <th class="py-2 px-4">{{ t('admin.pendingApprovalTable.table.headers.email') }}</th>
          <th class="py-2 px-4">{{ t('admin.pendingApprovalTable.table.headers.requestedRole') }}</th>
          <th class="py-2 px-4">{{ t('admin.pendingApprovalTable.table.headers.created') }}</th>
          <th class="py-2 px-4">{{ t('admin.pendingApprovalTable.table.headers.actions') }}</th>
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
                {{ t('admin.pendingApprovalTable.buttons.approve') }}
              </button>
              <button @click="rejectRole(user.id, user.role_slug)" :disabled="loading" class="text-xs bg-red-600/30 hover:bg-red-600/50 disabled:opacity-50 text-red-400 px-2 py-1 rounded transition">
                {{ t('admin.pendingApprovalTable.buttons.reject') }}
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>