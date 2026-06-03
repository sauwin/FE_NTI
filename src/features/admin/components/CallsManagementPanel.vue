<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAdminCalls, deleteAdminCall } from '@/features/admin/api/admin'
import { useConfirm } from "@/shared/composables/useConfirm.ts";
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const calls = ref<any[]>([])

const loadCalls = async () => {
  const res = await getAdminCalls()
  calls.value = res.data
}

const deleteCall = async (id: number) => {
  const confirmed = await useConfirm({
    title: t('admin.callsManagementPanel.confirmDelete.title'),
    message: t('admin.callsManagementPanel.confirmDelete.message'),
    confirmText: t('admin.callsManagementPanel.confirmDelete.confirmText'),
    cancelText: t('admin.callsManagementPanel.confirmDelete.cancelText'),
    danger: true,
  })
  if (!confirmed) return
  try {
    await deleteAdminCall(id)
    await loadCalls()
  } catch (e: any) {
    await useConfirm({
      title: t('admin.callsManagementPanel.errorDialog.title'),
      message: e.response?.data?.message || t('admin.callsManagementPanel.errorDialog.defaultMessage'),
      confirmText: t('admin.callsManagementPanel.errorDialog.confirmText'),
      danger: false,
    })
  }
}

onMounted(loadCalls)
</script>

<template>
  <div class="bg-slate-950 p-6 rounded-xl border border-slate-900">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-white font-bold text-xl">{{ $t('admin.callsManagementPanel.title') }}</h2>
      <router-link to="/admin/calls/create" class="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700">
        {{ $t('admin.callsManagementPanel.btnCreate') }}
      </router-link>
    </div>

    <table class="w-full text-left text-sm text-gray-400">
      <thead class="bg-slate-900 text-xs uppercase text-gray-500">
        <tr>
          <th class="p-3">{{ $t('admin.callsManagementPanel.tableHeaders.program') }}</th>
          <th class="p-3">{{ $t('admin.callsManagementPanel.tableHeaders.status') }}</th>
          <th class="p-3">{{ $t('admin.callsManagementPanel.tableHeaders.deadline') }}</th>
          <th class="p-3">{{ $t('admin.callsManagementPanel.tableHeaders.requiredDocs') }}</th>
          <th class="p-3">{{ $t('admin.callsManagementPanel.tableHeaders.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="call in calls" :key="call.id" class="border-b border-slate-900 hover:bg-slate-900/50">
          <td class="p-3 font-semibold text-white">{{ call.program?.code.toUpperCase() }}</td>
          <td class="p-3">
            <span :class="{
              'text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded text-xs': call.status === 'draft',
              'text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-xs': call.status === 'open',
              'text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-xs': call.status === 'closed'
            }">{{ call.status }}</span>
          </td>
          <td class="p-3">{{ call.deadline_at ? new Date(call.deadline_at).toLocaleDateString() : $t('admin.callsManagementPanel.tableRows.noDeadline') }}</td>
          <td class="p-3">{{ $t('admin.callsManagementPanel.tableRows.rulesCount', { count: call.required_documents?.length || 0 }) }}</td>
          <td class="p-3 flex gap-2">
            <router-link :to="`/admin/calls/${call.id}/edit`" class="text-blue-400 hover:underline">{{ $t('admin.callsManagementPanel.tableRows.btnEdit') }}</router-link>
            <button v-if="call.status === 'draft'" @click="deleteCall(call.id)" class="text-red-400 hover:underline ml-2">{{ $t('admin.callsManagementPanel.tableRows.btnDelete') }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>