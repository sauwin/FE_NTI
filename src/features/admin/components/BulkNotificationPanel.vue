<script setup>
import { ref, onMounted } from 'vue'
import api from '@/shared/api/axios'

const viewMode = ref('all') 
const selectedCallId = ref('') 
const subject = ref('')
const message = ref('')
const status = ref(null)
const loading = ref(false)

const calls = ref([])
const history = ref([])
const loadingHistory = ref(false)

const viewGroups = [
  { value: 'all', label: 'All Users' },
  { value: 'students', label: 'Students' },
  { value: 'companies', label: 'Companies' },
  { value: 'mentors', label: 'Mentors' },
  { value: 'call_selector', label: 'Specific Call Participants (Výzva)' },
]

onMounted(() => {
  fetchCalls()
  fetchHistory()
})

async function fetchCalls() {
  try {
    const res = await api.get('/admin/calls')
    calls.value = Array.isArray(res.data) ? res.data : (res.data.data || [])
  } catch (e) {
    console.warn('Failed to load active calls:', e.message)
  }
}

async function fetchHistory() {
  loadingHistory.value = true
  try {
    const res = await api.get('/admin/notifications/history')
    history.value = Array.isArray(res.data) ? res.data : (res.data.data || [])
  } catch (e) {
    console.warn('History failed to fetch:', e.message)
    history.value = []
  } finally {
    loadingHistory.value = false
  }
}

async function send() {
  if (viewMode.value === 'call_selector' && !selectedCallId.value) {
    status.value = { ok: false, text: 'Please select a specific Call window.' }
    return
  }

  const computedGroupValue = viewMode.value === 'call_selector' 
    ? `call_${selectedCallId.value}` 
    : viewMode.value

  let groupLabel = viewGroups.find(g => g.value === viewMode.value)?.label || viewMode.value
  if (viewMode.value === 'call_selector') {
    const foundCall = calls.value.find(c => c.id === Number(selectedCallId.value))
    groupLabel = `Applicants of Call: "${foundCall?.name || selectedCallId.value}"`
  }

  const confirmed = confirm(`Are you sure you want to send this mass email to [ ${groupLabel} ]?`)
  if (!confirmed) return

  loading.value = true
  status.value = null

  try {
    const res = await api.post('/admin/notifications/bulk', {
      recipient_group: computedGroupValue,
      subject: subject.value,
      message: message.value,
    })
    
    status.value = { ok: true, text: `Campaign saved & queued successfully for ${res.data?.queued ?? 'matched'} users.` }
    subject.value = ''
    message.value = ''
    selectedCallId.value = ''
    viewMode.value = 'all'
    
    fetchHistory()
    setTimeout(() => { status.value = null }, 5000)
  } catch (e) {
    status.value = { ok: false, text: e.response?.data?.message || e.message }
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('sk-SK', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    
    <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6 space-y-5">
      <div>
        <h3 class="text-xl font-bold text-white">Bulk Notifications</h3>
        <p class="text-sm text-slate-500 mt-1">Send global dashboard system announcements and mass email blasts.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div :class="viewMode === 'call_selector' ? 'md:col-span-1' : 'md:col-span-3'">
          <label class="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Recipient Audience *</label>
          <div class="relative">
            <select v-model="viewMode" class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none appearance-none cursor-pointer">
              <option v-for="g in viewGroups" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</span>
          </div>
        </div>

        <div v-if="viewMode === 'call_selector'" class="md:col-span-2">
          <label class="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Select Targeted Call *</label>
          <div class="relative">
            <select v-model="selectedCallId" class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none appearance-none cursor-pointer">
              <option value="" disabled>-- Select call filter window --</option>
              <option v-for="call in calls" :key="call.id" :value="call.id">
                {{ call.name }} (ID: #{{ call.id }})
              </option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</span>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Subject Title *</label>
        <input v-model="subject" maxlength="255" placeholder="Subject heading..." class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none placeholder-slate-600 transition-all" />
      </div>

      <div>
        <label class="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Message Core Content *</label>
        <textarea v-model="message" maxlength="10000" rows="6" placeholder="Write letter contents here..." class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none resize-none leading-relaxed placeholder-slate-600 transition-all" />
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-900">
        <button
            :disabled="loading || !subject || !message || (viewMode === 'call_selector' && !selectedCallId)"
            @click="send"
            class="px-5 py-2.5 bg-green-950/20 hover:bg-green-900 text-green-400 hover:text-white border border-green-900/60 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer"
        >
          {{ loading ? 'Broadcasting...' : 'Send Broadcast' }}
        </button>

        <p v-if="status" :class="status.ok ? 'text-green-400 bg-green-950/20 border-green-900/50' : 'text-red-400 bg-red-950/20 border-red-900/50'" class="text-xs font-mono border px-3 py-1.5 rounded-lg">
          {{ status.text }}
        </p>
      </div>
    </div>

    <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
      <div class="mb-4">
        <h4 class="text-base font-bold text-white flex items-center gap-2">
          <span>Broadcast Log History</span>
          <span v-if="history.length" class="text-xs font-normal font-mono text-slate-500">({{ history.length }})</span>
        </h4>
      </div>

      <div v-if="loadingHistory" class="text-slate-500 animate-pulse py-4 font-mono text-sm">
        Loading historical transmission waves...
      </div>

      <div v-else-if="history.length === 0" class="text-center py-8 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm italic">
        No mass broadcast events dispatched from this panel yet.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
            <tr>
              <th class="px-4 py-3 rounded-tl-lg">Sent Date</th>
              <th class="px-4 py-3">Group Audience</th>
              <th class="px-4 py-3">Subject & Text Preview</th>
              <th class="px-4 py-3 rounded-tr-lg text-right">Queued Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in history"
              :key="item.id"
              class="border-b border-slate-800/60 hover:bg-slate-800/10 transition align-top"
            >
              <td class="px-4 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                {{ formatDate(item.created_at) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span class="text-[10px] px-2 py-0.5 rounded border border-slate-800 bg-slate-950 text-slate-400 font-mono uppercase tracking-wider">
                  {{ item.recipient_group }}
                </span>
              </td>
              <td class="px-4 py-4 max-w-md">
                <div class="font-bold text-white text-sm leading-snug">{{ item.subject }}</div>
                <div class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {{ item.message }}
                </div>
              </td>
              <td class="px-4 py-4 text-right font-mono text-sm font-bold text-slate-400">
                {{ item.total_recipients }} users
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>