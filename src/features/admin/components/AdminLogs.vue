<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/shared/api/axios'

const props = defineProps<{ users: any[] }>()

const logs = ref<any[]>([])
const loading = ref(false)
const filterActionType = ref('')
const filterUserId = ref('')
const page = ref(1)
const total = ref(0)
const lastPage = ref(1)

const actionTypes = ['approve', 'assign', 'remove', 'block', 'delete', 'create', 'unblock']

async function fetchLogs() {
  loading.value = true
  try {
    const params: any = { page: page.value }
    if (filterActionType.value) params.action_type = filterActionType.value
    if (filterUserId.value) params.user_id = filterUserId.value

    const res = await api.get('/admin/logs', { params })
    logs.value = res.data.data
    total.value = res.data.total
    lastPage.value = res.data.last_page
  } catch {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filterActionType.value = ''
  filterUserId.value = ''
  page.value = 1
  fetchLogs()
}

onMounted(() => fetchLogs())

const actionColor = (action: string) => {
  const colors: Record<string, string> = {
    approve: 'bg-green-900/30 text-green-400',
    assign: 'bg-blue-900/30 text-blue-400',
    remove: 'bg-yellow-900/30 text-yellow-400',
    block: 'bg-red-900/30 text-red-400',
    delete: 'bg-red-900/30 text-red-400',
    create: 'bg-purple-900/30 text-purple-400',
    unblock: 'bg-slate-900/30 text-green-400',
  }
  return colors[action] || 'bg-slate-900/30 text-slate-400'
}
</script>

<template>
  <div>
    <div class="mb-6 space-y-4">
      <div class="flex gap-4 flex-wrap">
        <div class="flex-1 min-w-48">
          <label class="block text-sm font-medium text-white mb-2">Filter by Action</label>
          <select v-model="filterActionType" @change="() => { page = 1; fetchLogs() }" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">All actions</option>
            <option v-for="type in actionTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
        <div class="flex-1 min-w-48">
          <label class="block text-sm font-medium text-white mb-2">Filter by User</label>
          <select v-model="filterUserId" @change="() => { page = 1; fetchLogs() }" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="">All users</option>
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.first_name }} {{ user.last_name }}</option>
          </select>
        </div>
        <button @click="resetFilters" class="self-end px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition">Reset</button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8 text-slate-500">Loading logs...</div>

    <div v-else-if="logs.length === 0" class="text-center py-8 text-slate-500">No logs found</div>

    <div v-else class="space-y-2">
      <div v-for="log in logs" :key="log.id" class="border border-slate-800 rounded-lg p-4 bg-slate-900/30">
        <div class="flex items-start justify-between mb-2">
          <div>
            <span :class="['text-xs font-bold px-2 py-1 rounded', actionColor(log.action_type)]">{{ log.action_type }}</span>
            <span class="ml-2 text-sm text-slate-400">{{ log.admin.first_name }} {{ log.admin.last_name }}</span>
          </div>
          <div class="text-xs text-slate-500">{{ new Date(log.created_at).toLocaleString() }}</div>
        </div>
        <div v-if="log.targetUser" class="text-sm text-slate-300">
          Target: <span class="text-white">{{ log.targetUser.first_name }} {{ log.targetUser.last_name }}</span>
        </div>
        <div v-if="log.details" class="text-xs text-slate-500 mt-1">{{ log.details }}</div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="lastPage > 1" class="flex justify-center gap-2 mt-6">
      <button @click="() => { page = Math.max(1, page - 1); fetchLogs() }" :disabled="page === 1" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm rounded">Prev</button>
      <span class="text-white text-sm self-center">Page {{ page }} of {{ lastPage }}</span>
      <button @click="() => { page = Math.min(lastPage, page + 1); fetchLogs() }" :disabled="page === lastPage" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm rounded">Next</button>
    </div>
  </div>
</template>