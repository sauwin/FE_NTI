<script setup lang="ts">
import { ref } from 'vue'
import { approveUser, removeUserRole } from '@/features/admin/api/admin'
import { useConfirm } from '@/shared/composables/useConfirm'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  pendingUsers: any[]
  pendingCount: number
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
    setTimeout(() => { message.value = '' }, 3000)
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
    setTimeout(() => { message.value = '' }, 3000)
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

    <!-- Flash message -->
    <div
      v-if="message"
      :class="[
        'p-3 rounded-lg text-sm mb-6 border',
        success
          ? 'bg-green-900/20 border-green-800 text-green-400'
          : 'bg-red-900/20 border-red-800 text-red-400',
      ]"
    >
      {{ message }}
    </div>

    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h3 class="text-xl font-bold text-white">
          {{ t('admin.pendingApprovalTable.title') }}
        </h3>
        <p class="text-sm text-slate-500 mt-1">
          {{ t('admin.pendingApprovalTable.subtitle') }}
          <span
            v-if="pendingCount > 0"
            class="ml-1.5 text-xs font-mono px-1.5 py-0.5 rounded border bg-yellow-950/40 text-yellow-400 border-yellow-900"
          >
            {{ pendingCount }}
          </span>
        </p>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="pendingUsers.length === 0"
      class="text-center py-10 text-slate-500 italic text-sm"
    >
      {{ t('admin.pendingApprovalTable.emptyState') }}
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
          <tr>
            <th class="px-4 py-3 rounded-tl-lg">{{ t('admin.pendingApprovalTable.table.headers.name') }}</th>
            <th class="px-4 py-3">{{ t('admin.pendingApprovalTable.table.headers.email') }}</th>
            <th class="px-4 py-3">{{ t('admin.pendingApprovalTable.table.headers.requestedRole') }}</th>
            <th class="px-4 py-3">{{ t('admin.pendingApprovalTable.table.headers.created') }}</th>
            <th class="px-4 py-3 rounded-tr-lg text-right">{{ t('admin.pendingApprovalTable.table.headers.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in pendingUsers"
            :key="`${user.id}-${user.role_slug}`"
            class="border-b border-slate-800 hover:bg-slate-800/30 transition"
          >
            <td class="px-4 py-3">
              <div class="font-semibold text-white text-sm">
                {{ user.first_name }} {{ user.last_name }}
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="text-xs text-slate-500 font-mono">{{ user.email }}</div>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs font-mono px-2 py-1 rounded border uppercase bg-yellow-950/40 text-yellow-400 border-yellow-900">
                {{ user.role_slug }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs text-slate-500 font-mono">
                {{ new Date(user.created_at).toLocaleDateString() }}
              </span>
            </td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="approveRole(user.id, user.role_name)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border-emerald-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {{ t('admin.pendingApprovalTable.buttons.approve') }}
                </button>
                <button
                  @click="rejectRole(user.id, user.role_slug)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-red-900/40 hover:bg-red-900/60 text-red-400 border-red-800 transition disabled:opacity-50 cursor-pointer"
                >
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