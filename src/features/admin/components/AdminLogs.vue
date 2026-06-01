<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAdminLogs, getAdminUsersList } from '@/features/admin/api/admin'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, WidthType, HeadingLevel
} from 'docx'

const props = defineProps<{ users: any[] }>()

const logs = ref<any[]>([])
const loading = ref(false)
const filterActionType = ref('')
const filterUserId = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')
const page = ref(1)
const total = ref(0)
const lastPage = ref(1)
const exportLoading = ref<string | null>(null)
const adminUsers = ref<any[]>([])

const actionOptions = [
  { value: 'approve', label: 'Approve User' },
  { value: 'block', label: 'Block User' },
  { value: 'unblock', label: 'Unblock User' },
  { value: 'assign', label: 'Assign Role' },
  { value: 'remove', label: 'Remove Role' },
  { value: 'delete', label: 'Delete Record' },
  { value: 'create', label: 'Create Record' },
  { value: 'export', label: 'Export Data' },
  { value: 'bulk_notification', label: 'Bulk Notification' },
]

async function fetchLogs() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value }
    if (filterActionType.value) params.action_type = filterActionType.value
    if (filterUserId.value) params.user_id = filterUserId.value
    if (filterStartDate.value) params.date_from = filterStartDate.value
    if (filterEndDate.value) params.date_to = filterEndDate.value

    const res = await getAdminLogs(params)
    logs.value = res.data.data
    total.value = res.data.total
    lastPage.value = res.data.last_page
  } catch (err) {
    console.error('Failed to load logs', err)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filterActionType.value = ''
  filterUserId.value = ''
  filterStartDate.value = ''
  filterEndDate.value = ''
  page.value = 1
  fetchLogs()
}

async function fetchAllLogsForExport(): Promise<any[]> {
  const params: Record<string, any> = { export: 1 }
  if (filterActionType.value) params.action_type = filterActionType.value
  if (filterUserId.value) params.user_id = filterUserId.value
  if (filterStartDate.value) params.date_from = filterStartDate.value
  if (filterEndDate.value) params.date_to = filterEndDate.value
  const res = await getAdminLogs(params)
  return res.data as any[]
}

function buildExportRows(rawLogs: any[]): Record<string, string>[] {
  return rawLogs.map(log => {
    const adminName = log.user
      ? `${log.user.first_name ?? log.user.name ?? ''} ${log.user.last_name ?? ''}`.trim()
      : 'System'
    const adminEmail = log.user?.email ?? '—'
    const flat = flattenDetails(log.details)
    const detailsStr = Object.entries(flat).map(([k, v]) => `${formatKey(k)}: ${v}`).join(' | ')
    return {
      'Action': getBadgeText(log.action),
      'Description': getActionTitle(log),
      'Admin Name': adminName,
      'Admin Email': adminEmail,
      'IP Address': log.ip_address ?? '—',
      'Date & Time': new Date(log.created_at).toLocaleString('sk-SK'),
      'Details': detailsStr,
    }
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function exportCSV() {
  exportLoading.value = 'csv'
  try {
    const rows = buildExportRows(await fetchAllLogsForExport())
    const headers = Object.keys(rows[0] ?? {})
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [headers.map(escape).join(','), ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(','))].join('\r\n')
    downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), 'audit_logs.csv')
  } finally { exportLoading.value = null }
}

async function exportXLSX() {
  exportLoading.value = 'xlsx'
  try {
    const rows = buildExportRows(await fetchAllLogsForExport())
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 10 }, { wch: 28 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 20 }, { wch: 40 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    downloadBlob(new Blob([buf], { type: 'application/octet-stream' }), 'audit_logs.xlsx')
  } finally { exportLoading.value = null }
}

async function exportPDF() {
  exportLoading.value = 'pdf'
  try {
    const rows = buildExportRows(await fetchAllLogsForExport())
    const headers = Object.keys(rows[0] ?? {})
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    doc.setFontSize(14); doc.setTextColor(40, 40, 40)
    doc.text('NTI — Audit Log Report', 14, 15)
    doc.setFontSize(9); doc.setTextColor(120, 120, 120)
    doc.text(`Generated: ${new Date().toLocaleString('sk-SK')}`, 14, 21)
    autoTable(doc, {
      startY: 26, head: [headers], body: rows.map(r => headers.map(h => r[h] ?? '')),
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [15, 23, 42], textColor: [148, 163, 184], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 245, 249] }, columnStyles: { 6: { cellWidth: 55 } },
    })
    doc.save('audit_logs.pdf')
  } finally { exportLoading.value = null }
}

async function exportDOCX() {
  exportLoading.value = 'docx'
  try {
    const rows = buildExportRows(await fetchAllLogsForExport())
    const headers = Object.keys(rows[0] ?? {})
    const colWidths = [800, 2200, 1800, 2200, 1400, 1800, 4000]
    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => new TableCell({
        width: { size: colWidths[i] ?? 1800, type: WidthType.DXA },
        shading: { fill: '0F172A' },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: '94A3B8', size: 17 })] })],
      }))
    })
    const dataRows = rows.map(row => new TableRow({
      children: headers.map((h, i) => new TableCell({
        width: { size: colWidths[i] ?? 1800, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: String(row[h] ?? ''), size: 16 })] })],
      }))
    }))
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'NTI — Audit Log Report', heading: HeadingLevel.HEADING_1, spacing: { after: 120 } }),
          new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toLocaleString('sk-SK')}`, color: '64748B', size: 17 })], spacing: { after: 300 } }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] }),
        ],
      }],
    })
    downloadBlob(await Packer.toBlob(doc), 'audit_logs.docx')
  } finally { exportLoading.value = null }
}

const getBadgeText = (action: string) => action.includes('export') ? 'EXPORT' : action.toUpperCase()

const getBadgeColor = (action: string) => {
  if (action.includes('export')) return 'bg-amber-950/40 text-amber-500 border-amber-900'
  const colors: Record<string, string> = {
    approve: 'bg-emerald-950/60 text-emerald-400 border-emerald-900',
    assign: 'bg-blue-950/60 text-blue-400 border-blue-900',
    remove: 'bg-amber-950/40 text-amber-400 border-amber-900',
    block: 'bg-red-950/40 text-red-400 border-red-900',
    delete: 'bg-red-950/40 text-red-400 border-red-900',
    create: 'bg-indigo-950/60 text-indigo-400 border-indigo-900',
    unblock: 'bg-emerald-950/60 text-emerald-400 border-emerald-900',
    reset_password: 'bg-orange-950/40 text-orange-400 border-orange-900',
    bulk_notification: 'bg-blue-950/60 text-blue-400 border-blue-900',
  }
  return colors[action] || 'bg-slate-900 text-slate-600 border-slate-800'
}

const getActionTitle = (log: any) => {
  let baseAction = log.action
  let obj = log.object
  if (log.action === 'export_users') { baseAction = 'export'; obj = 'users' }
  else if (log.action === 'export_applications') { baseAction = 'export'; obj = 'applications' }
  else if (log.action === 'export_calls') { baseAction = 'export'; obj = 'calls' }
  const actionMap: Record<string, string> = {
    export: 'Export Data', approve: 'Approve', block: 'Block', unblock: 'Unblock',
    assign: 'Assign Role', remove: 'Remove Role', delete: 'Delete', create: 'Create',
    reset_password: 'Reset Password', bulk_notification: 'Bulk Notification',
  }
  const title = actionMap[baseAction] || baseAction
  return obj ? `${title} (${obj})` : title
}

const flattenDetails = (details: any) => {
  if (!details) return {}
  const result: Record<string, any> = {}
  let parsed = details
  if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed) } catch (_) {} }
  const sensitiveKeys = ['password', 'password_confirmation', 'token', 'admin_email']
  for (const key in parsed) {
    if (sensitiveKeys.includes(key.toLowerCase())) continue
    if (key === 'filters' && typeof parsed[key] === 'object' && parsed[key] !== null) {
      for (const fKey in parsed[key]) {
        if (sensitiveKeys.includes(fKey.toLowerCase())) continue
        if (!result[fKey] && parsed[key][fKey]) result[fKey] = parsed[key][fKey]
      }
    } else if (typeof parsed[key] !== 'object') {
      if (!result[key] && parsed[key]) result[key] = parsed[key]
    }
  }
  return result
}

const formatKey = (key: string) => key.replace(/_/g, ' ')

onMounted(async () => {
  const res = await getAdminUsersList()
  adminUsers.value = res.data
  fetchLogs()
})
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6 space-y-6">

    <!-- Header -->
    <div class="flex flex-wrap justify-between items-center gap-3">
      <h3 class="text-xl font-bold text-white">Audit Logs</h3>
      <div class="flex gap-2 flex-shrink-0">
        <button
          @click="exportCSV" :disabled="!!exportLoading"
          class="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-slate-300 border border-slate-700 transition font-mono disabled:opacity-40"
        >
          <span v-if="exportLoading === 'csv'" class="animate-spin w-3 h-3 border border-slate-400 border-t-transparent rounded-full inline-block mr-1"></span>
          Export CSV
        </button>
        <button
          @click="exportXLSX" :disabled="!!exportLoading"
          class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition font-mono disabled:opacity-40"
        >
          <span v-if="exportLoading === 'xlsx'" class="animate-spin w-3 h-3 border border-green-400 border-t-transparent rounded-full inline-block mr-1"></span>
          Export XLSX
        </button>
        <button
          @click="exportPDF" :disabled="!!exportLoading"
          class="text-xs bg-red-950/40 hover:bg-red-900/40 px-3 py-1.5 rounded text-red-400 border border-red-900 transition font-mono disabled:opacity-40"
        >
          <span v-if="exportLoading === 'pdf'" class="animate-spin w-3 h-3 border border-red-400 border-t-transparent rounded-full inline-block mr-1"></span>
          Export PDF
        </button>
        <button
          @click="exportDOCX" :disabled="!!exportLoading"
          class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition font-mono disabled:opacity-40"
        >
          <span v-if="exportLoading === 'docx'" class="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full inline-block mr-1"></span>
          Export DOCX
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
      <div>
        <select
          v-model="filterActionType"
          @change="() => { page = 1; fetchLogs() }"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-600 outline-none"
        >
          <option value="">All Actions</option>
          <option v-for="option in actionOptions" :key="option.value" :value="option.value" class="bg-slate-950">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div>
        <select
          v-model="filterUserId"
          @change="() => { page = 1; fetchLogs() }"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-600 outline-none"
        >
          <option value="">All Administrators</option>
          <option v-for="user in adminUsers" :key="user.id" :value="user.id" class="bg-slate-950">
            {{ user.first_name ?? user.name }} {{ user.last_name ?? '' }}
          </option>
        </select>
      </div>
      <div>
        <input
          type="date" v-model="filterStartDate"
          @change="() => { page = 1; fetchLogs() }"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-600 outline-none"
        />
      </div>
      <div class="flex gap-2">
        <input
          type="date" v-model="filterEndDate"
          @change="() => { page = 1; fetchLogs() }"
          class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-600 outline-none"
        />
        <button
          @click="resetFilters"
          class="bg-slate-800 hover:bg-slate-700 text-white font-medium px-3 py-1.5 rounded-lg transition text-sm"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-slate-500 italic text-sm py-6 text-center animate-pulse">
      Loading logs...
    </div>

    <!-- Empty -->
    <div v-else-if="logs.length === 0" class="text-slate-500 italic text-sm py-6 text-center">
      No logs found.
    </div>

    <!-- Log list -->
    <div v-else class="space-y-3">
      <div
        v-for="log in logs"
        :key="log.id"
        class="border border-slate-800 bg-slate-950 rounded-xl p-5 hover:border-slate-700 transition"
      >
        <!-- Badge + title + timestamp -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div class="flex items-center gap-3">
            <span :class="['text-xs font-mono px-2 py-1 rounded border uppercase', getBadgeColor(log.action)]">
              {{ getBadgeText(log.action) }}
            </span>
            <span class="text-sm font-semibold text-white">{{ getActionTitle(log) }}</span>
          </div>
          <span class="text-xs font-mono text-slate-500">
            {{ new Date(log.created_at).toLocaleString('sk-SK') }}
          </span>
        </div>

        <!-- Admin info + IP -->
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400 font-mono mb-4 pb-4 border-b border-slate-800">
          <span>
            By: <span class="text-slate-200">
              {{ log.user ? `${log.user.first_name ?? log.user.name} ${log.user.last_name ?? ''}`.trim() : 'System' }}
            </span>
          </span>
          <span v-if="log.user?.email" class="text-slate-500">{{ log.user.email }}</span>
          <span v-if="log.ip_address" class="ml-auto text-slate-600">{{ log.ip_address }}</span>
        </div>

        <!-- Detail badges -->
        <div
          v-if="log.details && Object.keys(flattenDetails(log.details)).length > 0"
          class="flex flex-wrap gap-2"
        >
          <span
            v-for="(value, key) in flattenDetails(log.details)"
            :key="key"
            class="text-xs inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg"
          >
            <span class="text-slate-500 capitalize">{{ formatKey(String(key)) }}:</span>
            <span class="font-semibold text-white">{{ value }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="lastPage > 1"
      class="flex items-center justify-between pt-4 border-t border-slate-800"
    >
      <span class="text-xs font-mono text-slate-500">Page {{ page }} of {{ lastPage }}</span>
      <div class="flex items-center gap-2">
        <button
          @click="() => { page = Math.max(1, page - 1); fetchLogs() }"
          :disabled="page === 1"
          class="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-slate-300 transition font-mono disabled:opacity-50"
        >
          ← Previous
        </button>
        <button
          @click="() => { page = Math.min(lastPage, page + 1); fetchLogs() }"
          :disabled="page === lastPage"
          class="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-slate-300 transition font-mono disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>