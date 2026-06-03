<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAdminCalls, getNotificationHistory, sendBulkNotification, exportNotifications } from '@/features/admin/api/admin'
import { useConfirm } from "@/shared/composables/useConfirm.ts"
import type { Call, NotificationItem, StatusMessage, GroupOption } from '@/features/admin/types/admin'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const viewMode = ref<string>('all') 
const selectedCallId = ref<string>('') 
const subject = ref<string>('')
const message = ref<string>('')
const status = ref<StatusMessage | null>(null)
const loading = ref<boolean>(false)
const calls = ref<Call[]>([])
const history = ref<NotificationItem[]>([])
const loadingHistory = ref<boolean>(false)

const exportLoading = ref<boolean>(false)
const exportMessage = ref<string>('')
const exportSuccess = ref<boolean>(false)

const viewGroups = computed<GroupOption[]>(() => [
  { value: 'all', label: t('admin.bulkNotificationPanel.audiences.all') },
  { value: 'students', label: t('admin.bulkNotificationPanel.audiences.students') },
  { value: 'companies', label: t('admin.bulkNotificationPanel.audiences.companies') },
  { value: 'mentors', label: t('admin.bulkNotificationPanel.audiences.mentors') },
  { value: 'call_selector', label: t('admin.bulkNotificationPanel.audiences.callSelector') },
])

const historyFilterSubject = ref<string>('')
const historyFilterGroup = ref<string>('')
const historyFilterSender = ref<string>('')
const historyFilterDateFrom = ref<string>('')
const historyFilterDateTo = ref<string>('')

const uniqueGroups = computed<string[]>(() => [
  ...new Set(history.value.map(h => h.recipient_group))
])

const uniqueSenders = computed<{ id: number; name: string }[]>(() => {
  const senders = history.value
    .filter((h): h is NotificationItem & { sender_id: number; sender: any } => !!h.sender && h.sender_id !== null)
    .map(h => ({
      id: h.sender_id,
      name: `${h.sender.first_name ?? ''} ${h.sender.last_name ?? ''}`.trim() || h.sender.email
    }))
  return [...new Map(senders.map(s => [s.id, s])).values()]
})

const filteredHistory = computed<NotificationItem[]>(() => {
  return history.value.filter(item => {
    if (historyFilterSubject.value && !item.subject.toLowerCase().includes(historyFilterSubject.value.toLowerCase())) return false
    if (historyFilterGroup.value && item.recipient_group !== historyFilterGroup.value) return false
    if (historyFilterSender.value && String(item.sender_id) !== String(historyFilterSender.value)) return false
    if (historyFilterDateFrom.value && new Date(item.created_at) < new Date(historyFilterDateFrom.value)) return false
    if (historyFilterDateTo.value && new Date(item.created_at) > new Date(historyFilterDateTo.value + 'T23:59:59')) return false
    return true
  })
})

onMounted(() => {
  fetchCalls()
  fetchHistory()
})

function resetHistoryFilters(): void {
  historyFilterSubject.value = ''
  historyFilterGroup.value = ''
  historyFilterSender.value = ''
  historyFilterDateFrom.value = ''
  historyFilterDateTo.value = ''
}

async function triggerExport(format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
  exportLoading.value = true
  exportMessage.value = ''
  
  try {
    const response = await exportNotifications({
      subject: historyFilterSubject.value || undefined,
      recipient_group: historyFilterGroup.value || undefined,
      sender_id: historyFilterSender.value || undefined,
      date_from: historyFilterDateFrom.value || undefined,
      date_to: historyFilterDateTo.value || undefined,
      format,
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `notifications_export_${new Date().toISOString().split('T')[0]}.${format}`)
    document.body.appendChild(link)
    
    link.click()
    
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    exportSuccess.value = true
    exportMessage.value = t('admin.bulkNotificationPanel.jsMessages.exportSuccess', { format: format.toUpperCase() })
    setTimeout(() => { exportSuccess.value = false; exportMessage.value = '' }, 3000)
  } catch (e: any) {
    exportSuccess.value = false
    exportMessage.value = e.response?.data?.message || t('admin.bulkNotificationPanel.jsMessages.exportFailed', { format: format.toUpperCase() })
  } finally {
    exportLoading.value = false
  }
}

async function fetchCalls(): Promise<void> {
  try {
    const res: any = await getAdminCalls()
    calls.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
  } catch (e: any) {
    console.warn('Failed to load active calls:', e.message)
  }
}

async function fetchHistory(): Promise<void> {
  loadingHistory.value = true
  try {
    const res = await getNotificationHistory()
    history.value = Array.isArray(res.data) ? res.data : (res.data.data || [])
  } catch (e: any) {
    console.warn('History failed to fetch:', e.message)
    history.value = []
  } finally {
    loadingHistory.value = false
  }
}

async function send(): Promise<void> {
  if (viewMode.value === 'call_selector' && !selectedCallId.value) {
    status.value = { ok: false, text: t('admin.bulkNotificationPanel.jsMessages.selectCallError') }
    return
  }

  const computedGroupValue = viewMode.value === 'call_selector' 
    ? `call_${selectedCallId.value}` 
    : viewMode.value

  let groupLabel = viewGroups.value.find(g => g.value === viewMode.value)?.label || viewMode.value
  if (viewMode.value === 'call_selector') {
    const foundCall = calls.value.find(c => c.id === Number(selectedCallId.value))
    groupLabel = t('admin.bulkNotificationPanel.jsMessages.applicantsOfCall', { name: foundCall?.name || selectedCallId.value })
  }

  const confirmed = await useConfirm({
    title: t('admin.bulkNotificationPanel.jsMessages.confirmTitle'),
    message: t('admin.bulkNotificationPanel.jsMessages.confirmMessage', { group: groupLabel }),
    confirmText: t('admin.bulkNotificationPanel.jsMessages.confirmText'),
    cancelText: t('admin.bulkNotificationPanel.jsMessages.cancelText'),
    danger: false,
  })
  if (!confirmed) return

  loading.value = true
  status.value = null

  try {
    const res = await sendBulkNotification({
      recipient_group: computedGroupValue,
      subject: subject.value,
      message: message.value,
    })
    
    status.value = { 
      ok: true, 
      text: t('admin.bulkNotificationPanel.jsMessages.successMessage', { count: res.data?.queued ?? t('admin.bulkNotificationPanel.jsMessages.matchedFallback') }) 
    }
    subject.value = ''
    message.value = ''
    selectedCallId.value = ''
    viewMode.value = 'all'
    
    fetchHistory()
    setTimeout(() => { status.value = null }, 5000)
  } catch (e: any) {
    status.value = { ok: false, text: e.response?.data?.message || e.message }
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr: string | null | undefined): string {
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
        <h3 class="text-xl font-bold text-white">{{ $t('admin.bulkNotificationPanel.form.title') }}</h3>
        <p class="text-sm text-slate-500 mt-1">{{ $t('admin.bulkNotificationPanel.form.description') }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div :class="viewMode === 'call_selector' ? 'md:col-span-1' : 'md:col-span-3'">
          <label class="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">{{ $t('admin.bulkNotificationPanel.form.audienceLabel') }}</label>
          <div class="relative">
            <select v-model="viewMode" class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none appearance-none cursor-pointer">
              <option v-for="g in viewGroups" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</span>
          </div>
        </div>

        <div v-if="viewMode === 'call_selector'" class="md:col-span-2">
          <label class="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">{{ $t('admin.bulkNotificationPanel.form.callLabel') }}</label>
          <div class="relative">
            <select v-model="selectedCallId" class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none appearance-none cursor-pointer">
              <option value="" disabled>{{ $t('admin.bulkNotificationPanel.form.callPlaceholder') }}</option>
              <option v-for="call in calls" :key="call.id" :value="call.id">
                {{ call.name }} (ID: #{{ call.id }})
              </option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-xs">▼</span>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">{{ $t('admin.bulkNotificationPanel.form.subjectLabel') }}</label>
        <input v-model="subject" maxlength="255" :placeholder="$t('admin.bulkNotificationPanel.form.subjectPlaceholder')" class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-4 py-2 text-white text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none placeholder-slate-600 transition-all" />
      </div>

      <div>
        <label class="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">{{ $t('admin.bulkNotificationPanel.form.messageLabel') }}</label>
        <textarea v-model="message" maxlength="10000" rows="6" :placeholder="$t('admin.bulkNotificationPanel.form.messagePlaceholder')" class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-4 py-3 text-white text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none resize-none leading-relaxed placeholder-slate-600 transition-all" />
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-900">
        <button
            :disabled="loading || !subject || !message || (viewMode === 'call_selector' && !selectedCallId)"
            @click="send"
            class="px-5 py-2.5 bg-green-950/20 hover:bg-green-900 text-green-400 hover:text-white border border-green-900/60 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer"
        >
          {{ loading ? $t('admin.bulkNotificationPanel.form.btnSending') : $t('admin.bulkNotificationPanel.form.btnSend') }}
        </button>

        <p v-if="status" :class="status.ok ? 'text-green-400 bg-green-950/20 border-green-900/50' : 'text-red-400 bg-red-950/20 border-red-900/50'" class="text-xs font-mono border px-3 py-1.5 rounded-lg">
          {{ status.text }}
        </p>
      </div>
    </div>

    <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
      <div class="space-y-4 mb-6">
        <div v-if="exportMessage" :class="[
          'p-3 rounded-lg text-sm border transition-all',
          exportSuccess
            ? 'bg-green-900/20 border-green-800 text-green-400'
            : 'bg-red-900/20 border-red-800 text-red-400'
        ]">
          {{ exportMessage }}
        </div>

        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 class="text-xl font-bold text-white">{{ $t('admin.bulkNotificationPanel.history.title') }}</h3>
            <p class="text-sm text-slate-500 mt-1">
              {{ $t('admin.bulkNotificationPanel.history.description') }}
            </p>
          </div>

          <div class="flex-shrink-0 gap-2 flex">
            <button
              @click="triggerExport('csv')"
              :disabled="exportLoading"
              class="text-xs bg-green-900/40 hover:bg-green-900/60 disabled:opacity-50 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono cursor-pointer"
            >
              {{ $t('admin.bulkNotificationPanel.history.btnCsv') }}
            </button>

            <button
              @click="triggerExport('xlsx')"
              :disabled="exportLoading"
              class="text-xs bg-blue-900/40 hover:bg-blue-900/60 disabled:opacity-50 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono cursor-pointer"
            >
              {{ $t('admin.bulkNotificationPanel.history.btnXlsx') }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <input
          v-model="historyFilterSubject"
          :placeholder="$t('admin.bulkNotificationPanel.history.filterSubject')"
          class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 outline-none transition-all"
        />

        <select
          v-model="historyFilterGroup"
          class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer"
        >
          <option value="">{{ $t('admin.bulkNotificationPanel.history.filterAllGroups') }}</option>
          <option v-for="g in uniqueGroups" :key="g" :value="g">{{ g }}</option>
        </select>

        <select
          v-model="historyFilterSender"
          class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer"
        >
          <option value="">{{ $t('admin.bulkNotificationPanel.history.filterAllSenders') }}</option>
          <option v-for="s in uniqueSenders" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>

        <input
          v-model="historyFilterDateFrom"
          type="date"
          class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all"
        />

        <div class="flex gap-2">
          <input
            v-model="historyFilterDateTo"
            type="date"
            class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all"
          />
          <button
            @click="resetHistoryFilters"
            class="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-lg transition-all whitespace-nowrap"
          >
            {{ $t('admin.bulkNotificationPanel.history.btnReset') }}
          </button>
        </div>
      </div>

      <div v-if="loadingHistory" class="text-slate-500 animate-pulse py-4 font-mono text-sm">
        {{ $t('admin.bulkNotificationPanel.history.loading') }}
      </div>

      <div v-else-if="filteredHistory.length === 0" class="text-center py-8 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm italic">
        {{ history.length === 0 ? $t('admin.bulkNotificationPanel.history.noHistory') : $t('admin.bulkNotificationPanel.history.noResults') }}
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
            <tr>
              <th class="px-4 py-3 rounded-tl-lg">{{ $t('admin.bulkNotificationPanel.table.date') }}</th>
              <th class="px-4 py-3">{{ $t('admin.bulkNotificationPanel.table.sender') }}</th>
              <th class="px-4 py-3">{{ $t('admin.bulkNotificationPanel.table.audience') }}</th>
              <th class="px-4 py-3">{{ $t('admin.bulkNotificationPanel.table.preview') }}</th>
              <th class="px-4 py-3 rounded-tr-lg text-right">{{ $t('admin.bulkNotificationPanel.table.total') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredHistory"
              :key="item.id"
              class="border-b border-slate-800/60 hover:bg-slate-800/10 transition align-top"
            >
              <td class="px-4 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                {{ formatDate(item.created_at) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm text-slate-200">
                  {{ item.sender ? `${item.sender.first_name ?? ''} ${item.sender.last_name ?? ''}`.trim() || item.sender.email : '—' }}
                </div>
                <div v-if="item.sender?.email" class="text-xs text-slate-500 font-mono mt-0.5">{{ item.sender.email }}</div>
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span class="text-[10px] px-2 py-0.5 rounded border border-slate-800 bg-slate-950 text-slate-400 font-mono uppercase tracking-wider">
                  {{ item.recipient_group }}
                </span>
              </td>
              <td class="px-4 py-4 max-w-md">
                <div class="font-bold text-white text-sm leading-snug">{{ item.subject }}</div>
                <div class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{{ item.message }}</div>
              </td>
              <td class="px-4 py-4 text-right font-mono text-sm font-bold text-slate-400">
                {{ item.total_recipients }} {{ $t('admin.bulkNotificationPanel.table.users') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>