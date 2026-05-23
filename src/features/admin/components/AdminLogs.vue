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

// Updated to use value-label pairs for a much cleaner dropdown interface
const actionOptions = [
  { value: 'approve', label: 'Approve User' },
  { value: 'block', label: 'Block User' },
  { value: 'unblock', label: 'Unblock User' },
  { value: 'assign', label: 'Assign Role' },
  { value: 'remove', label: 'Remove Role' },
  { value: 'delete', label: 'Delete Record' },
  { value: 'create', label: 'Create Record' },
  { value: 'export', label: 'Export Data (Generic)' },
  { value: 'export_users', label: 'Export Users' },
  { value: 'export_applications', label: 'Export Applications' },
  { value: 'export_calls', label: 'Export Calls' }
]

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
  } catch (error) {
    console.error('Failed to load logs', error)
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

// Ensures the badge strictly says "EXPORT" for any export-related action
const getBadgeText = (action: string) => {
  if (action.includes('export')) return 'EXPORT'
  return action.toUpperCase()
}

const getBadgeColor = (action: string) => {
  if (action.includes('export')) return 'bg-teal-950/50 text-teal-400 border-teal-900/50'

  const colors: Record<string, string> = {
    approve: 'bg-green-950/50 text-green-400 border-green-900/50',
    assign: 'bg-blue-950/50 text-blue-400 border-blue-900/50',
    remove: 'bg-yellow-950/50 text-yellow-400 border-yellow-900/50',
    block: 'bg-red-950/50 text-red-400 border-red-900/50',
    delete: 'bg-red-950/50 text-red-400 border-red-900/50',
    create: 'bg-purple-950/50 text-purple-400 border-purple-900/50',
    unblock: 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50',
  }
  return colors[action] || 'bg-slate-900/50 text-slate-400 border-slate-800'
}

// Strictly formats title to match exactly: "Export Data (users)"
const getActionTitle = (log: any) => {
  let baseAction = log.action
  let obj = log.object

  // Normalize legacy database entries
  if (log.action === 'export_users') {
    baseAction = 'export'
    obj = 'users'
  } else if (log.action === 'export_applications') {
    baseAction = 'export'
    obj = 'applications'
  } else if (log.action === 'export_calls') {
    baseAction = 'export'
    obj = 'calls'
  }

  const actionMap: Record<string, string> = {
    export: 'Export Data',
    approve: 'Approve',
    block: 'Block',
    unblock: 'Unblock',
    assign: 'Assign Role',
    remove: 'Remove Role',
    delete: 'Delete',
    create: 'Create'
  }
  
  const title = actionMap[baseAction] || baseAction
  return obj ? `${title} (${obj})` : title
}

// Completely eliminates duplicate keys and removes sensitive info
const flattenDetails = (details: any) => {
  if (!details) return {}
  const result: Record<string, any> = {}
  
  let parsed = details
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed) } catch (e) {}
  }

  const sensitiveKeys = ['password', 'password_confirmation', 'token', 'admin_email']

  for (const key in parsed) {
    if (sensitiveKeys.includes(key.toLowerCase())) continue

    // Merge nested filter objects into the root to avoid duplicates
    if (key === 'filters' && typeof parsed[key] === 'object' && parsed[key] !== null) {
      for (const fKey in parsed[key]) {
        if (sensitiveKeys.includes(fKey.toLowerCase())) continue
        if (!result[fKey] && parsed[key][fKey]) {
          result[fKey] = parsed[key][fKey]
        }
      }
    } else if (typeof parsed[key] !== 'object') {
       if (!result[key] && parsed[key]) {
         result[key] = parsed[key]
       }
    }
  }
  return result
}

const formatKey = (key: string) => {
  return key.replace(/_/g, ' ')
}
</script>

<template>
  <div>
    <!-- Filter Panel -->
    <div class="mb-6 space-y-4">
      <div class="flex gap-4 flex-wrap">
        <div class="flex-1 min-w-48">
          <label class="block text-sm font-medium text-slate-300 mb-2">Filter by Action</label>
          <select v-model="filterActionType" @change="() => { page = 1; fetchLogs() }" class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none">
            <option value="">All actions</option>
            <option v-for="option in actionOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="flex-1 min-w-48">
          <label class="block text-sm font-medium text-slate-300 mb-2">Filter by Administrator</label>
          <select v-model="filterUserId" @change="() => { page = 1; fetchLogs() }" class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none">
            <option value="">All administrators</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.first_name ?? user.name }} {{ user.last_name ?? '' }}
            </option>
          </select>
        </div>
        <button @click="resetFilters" class="self-end px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm rounded-lg transition-all">
          Reset
        </button>
      </div>
    </div>

    <!-- Loading and Empty States -->
    <div v-if="loading" class="text-center py-12 text-slate-500">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mx-auto mb-4"></div>
      Loading logs...
    </div>
    <div v-else-if="logs.length === 0" class="text-center py-12 text-slate-500 bg-[#0B1120]/50 rounded-xl border border-dashed border-slate-800">
      No logs found
    </div>

    <!-- Log List -->
    <div v-else class="space-y-4">
      <div v-for="log in logs" :key="log.id" class="border border-slate-800/80 rounded-xl p-5 bg-[#0B1120] hover:border-slate-700 transition-colors">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div class="flex items-center gap-4">
            <span :class="['text-[11px] font-bold px-2.5 py-1 rounded border tracking-wider', getBadgeColor(log.action)]">
              {{ getBadgeText(log.action) }}
            </span>
            <span class="text-[15px] font-medium text-slate-100">
              {{ getActionTitle(log) }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-[13px] text-slate-500 font-mono">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {{ new Date(log.created_at).toLocaleString('sk-SK') }}
          </div>
        </div>
        
        <!-- Administrator Info -->
        <div class="flex items-center gap-2 text-[13px] text-slate-400 mb-4 pb-4 border-b border-slate-800/60">
          <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span>Performed by: <span class="font-medium text-slate-200">{{ log.user ? `${log.user.first_name ?? log.user.name} ${log.user.last_name ?? ''}` : 'System' }}</span></span>
        </div>
        
        <!-- Details (Formatted Badges exactly like Image 2) -->
        <div v-if="log.details && Object.keys(flattenDetails(log.details)).length > 0" class="flex flex-wrap gap-2">
          <span v-for="(value, key) in flattenDetails(log.details)" :key="key" 
                class="text-[12px] inline-flex items-center gap-1.5 bg-[#111827] text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800/80">
            <span class="text-slate-500 capitalize">{{ formatKey(key) }}:</span> 
            <span class="font-semibold">{{ value }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="lastPage > 1" class="flex justify-center items-center gap-3 mt-8">
      <button @click="() => { page = Math.max(1, page - 1); fetchLogs() }" :disabled="page === 1" class="px-4 py-2 bg-[#0B1120] border border-slate-800 hover:border-slate-600 disabled:opacity-50 text-white text-sm rounded-lg transition-all">Previous</button>
      <span class="text-slate-500 text-sm font-medium">Page {{ page }} of {{ lastPage }}</span>
      <button @click="() => { page = Math.min(lastPage, page + 1); fetchLogs() }" :disabled="page === lastPage" class="px-4 py-2 bg-[#0B1120] border border-slate-800 hover:border-slate-600 disabled:opacity-50 text-white text-sm rounded-lg transition-all">Next</button>
    </div>
  </div>
</template>