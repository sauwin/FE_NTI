<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/shared/api/axios'
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
]

// ─── Data fetching ─────────────────────────────────────────────────────────

async function fetchLogs() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value }
    if (filterActionType.value) params.action_type = filterActionType.value
    if (filterUserId.value) params.user_id = filterUserId.value
    if (filterStartDate.value) params.date_from = filterStartDate.value;
    if (filterEndDate.value) params.date_to = filterEndDate.value;

    const res = await api.get('/admin/logs', { params })
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

// ─── Export helpers ────────────────────────────────────────────────────────

async function fetchAllLogsForExport(): Promise<any[]> {
  const params: Record<string, any> = { export: 1 } 
  
  if (filterActionType.value) params.action_type = filterActionType.value
  if (filterUserId.value) params.user_id = filterUserId.value
  if (filterStartDate.value) params.date_from = filterStartDate.value
  if (filterEndDate.value) params.date_to = filterEndDate.value

  const res = await api.get('/admin/logs', { params })
  
  return res.data as any[] 
}

function buildExportRows(rawLogs: any[]): Record<string, string>[] {
  return rawLogs.map(log => {
    const adminName  = log.user
      ? `${log.user.first_name ?? log.user.name ?? ''} ${log.user.last_name ?? ''}`.trim()
      : 'System'
    const adminEmail = log.user?.email ?? '—'
    const flat = flattenDetails(log.details)
    const detailsStr = Object.entries(flat)
      .map(([k, v]) => `${formatKey(k)}: ${v}`)
      .join(' | ')

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

// ─── CSV ───────────────────────────────────────────────────────────────────

async function exportCSV() {
  exportLoading.value = 'csv'
  try {
    const rows = buildExportRows(await fetchAllLogsForExport())
    const headers = Object.keys(rows[0] ?? {})
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`

    const csv = [
      headers.map(escape).join(','),
      ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(',')),
    ].join('\r\n')

    downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), 'audit_logs.csv')
  } finally {
    exportLoading.value = null
  }
}

// ─── XLSX ──────────────────────────────────────────────────────────────────

async function exportXLSX() {
  exportLoading.value = 'xlsx'
  try {
    const rows = buildExportRows(await fetchAllLogsForExport())
    const ws   = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 10 }, { wch: 28 }, { wch: 22 }, { wch: 28 },
      { wch: 16 }, { wch: 20 }, { wch: 40 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    downloadBlob(new Blob([buf], { type: 'application/octet-stream' }), 'audit_logs.xlsx')
  } finally {
    exportLoading.value = null
  }
}

// ─── PDF ───────────────────────────────────────────────────────────────────

async function exportPDF() {
  exportLoading.value = 'pdf'
  try {
    const rows = buildExportRows(await fetchAllLogsForExport())
    const headers = Object.keys(rows[0] ?? {})

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    doc.setFontSize(14)
    doc.setTextColor(40, 40, 40)
    doc.text('NTI — Audit Log Report', 14, 15)
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(`Generated: ${new Date().toLocaleString('sk-SK')}`, 14, 21)

    autoTable(doc, {
      startY: 26,
      head: [headers],
      body: rows.map(r => headers.map(h => r[h] ?? '')),
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: [15, 23, 42], textColor: [148, 163, 184], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: { 6: { cellWidth: 55 } },
    })

    doc.save('audit_logs.pdf')
  } finally {
    exportLoading.value = null
  }
}

// ─── DOCX ──────────────────────────────────────────────────────────────────

async function exportDOCX() {
  exportLoading.value = 'docx'
  try {
    const rows      = buildExportRows(await fetchAllLogsForExport())
    const headers   = Object.keys(rows[0] ?? {})
    const colWidths = [800, 2200, 1800, 2200, 1400, 1800, 4000]

    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map((h, i) =>
        new TableCell({
          width:    { size: colWidths[i] ?? 1800, type: WidthType.DXA },
          shading:  { fill: '0F172A' },
          children: [new Paragraph({
            children: [new TextRun({ text: h, bold: true, color: '94A3B8', size: 17 })],
          })],
        })
      ),
    })

    const dataRows = rows.map(row =>
      new TableRow({
        children: headers.map((h, i) =>
          new TableCell({
            width:    { size: colWidths[i] ?? 1800, type: WidthType.DXA },
            children: [new Paragraph({
              children: [new TextRun({ text: String(row[h] ?? ''), size: 16 })],
            })],
          })
        ),
      })
    )

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            text:    'NTI — Audit Log Report',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [new TextRun({
              text:  `Generated: ${new Date().toLocaleString('sk-SK')}`,
              color: '64748B',
              size:  17,
            })],
            spacing: { after: 300 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows:  [headerRow, ...dataRows],
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    downloadBlob(blob, 'audit_logs.docx')
  } finally {
    exportLoading.value = null
  }
}

// ─── Display helpers ───────────────────────────────────────────────────────

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
    reset_password: 'bg-orange-950/50 text-orange-400 border-orange-900/50',
  }
  return colors[action] || 'bg-slate-900/50 text-slate-400 border-slate-800'
}

const getActionTitle = (log: any) => {
  let baseAction = log.action
  let obj        = log.object

  if (log.action === 'export_users') { baseAction = 'export'; obj = 'users' }
  else if (log.action === 'export_applications') { baseAction = 'export'; obj = 'applications'}
  else if (log.action === 'export_calls') { baseAction = 'export'; obj = 'calls' }

  const actionMap: Record<string, string> = {
    export: 'Export Data',
    approve: 'Approve',
    block: 'Block',
    unblock: 'Unblock',
    assign: 'Assign Role',
    remove: 'Remove Role',
    delete: 'Delete',
    create: 'Create',
    reset_password: 'Reset Password',
  }

  const title = actionMap[baseAction] || baseAction
  return obj ? `${title} (${obj})` : title
}

const flattenDetails = (details: any) => {
  if (!details) return {}
  const result: Record<string, any> = {}
  let parsed = details
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed) } catch (_) {}
  }
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
  const res = await api.get('/admin/admin-users')
  adminUsers.value = res.data
  fetchLogs()
})
</script>

<template>
  <div>
    <!-- ── Filter + Export Panel ──────────────────────────────────────────── -->
    <div class="mb-6 space-y-4">
      <div class="flex gap-4 flex-wrap items-end">

        <div class="flex-1 min-w-48">
          <label class="block text-sm font-medium text-slate-300 mb-2">Filter by Action</label>
          <select
            v-model="filterActionType"
            @change="() => { page = 1; fetchLogs() }"
            class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"
          >
            <option value="">All actions</option>
            <option v-for="option in actionOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="flex-1 min-w-48">
          <label class="block text-sm font-medium text-slate-300 mb-2">Filter by Administrator</label>
          <select
            v-model="filterUserId"
            @change="() => { page = 1; fetchLogs() }"
            class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"
          >
            <option value="">All administrators</option>
            <option v-for="user in adminUsers" :key="user.id" :value="user.id">
              {{ user.first_name ?? user.name }} {{ user.last_name ?? '' }}
            </option>
          </select>
        </div>

        <div class="flex gap-2 min-w-[300px]">
          <div class="flex-1">
            <label class="block text-sm font-medium text-slate-300 mb-2">From</label>
            <input 
              type="date" 
              v-model="filterStartDate"
              @change="() => { page = 1; fetchLogs() }"
              class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-slate-300 mb-2">To</label>
            <input 
              type="date" 
              v-model="filterEndDate"
              @change="() => { page = 1; fetchLogs() }"
              class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <button
          @click="resetFilters"
          class="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm rounded-lg transition-all"
        >Reset</button>

        <!-- Export buttons -->
        <div class="flex items-center gap-2 ml-auto">
          <span class="text-xs text-slate-500 font-mono uppercase tracking-widest mr-1">Export:</span>

          <button @click="exportCSV" :disabled="!!exportLoading"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-wait">
            <span v-if="exportLoading === 'csv'" class="animate-spin w-3 h-3 border border-slate-400 border-t-transparent rounded-full inline-block"></span>
            <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            CSV
          </button>

          <button @click="exportXLSX" :disabled="!!exportLoading"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-900/60 bg-green-950/30 hover:bg-green-900/40 text-green-400 hover:text-green-300 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-wait">
            <span v-if="exportLoading === 'xlsx'" class="animate-spin w-3 h-3 border border-green-400 border-t-transparent rounded-full inline-block"></span>
            <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            XLSX
          </button>

          <button @click="exportPDF" :disabled="!!exportLoading"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-900/60 bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-wait">
            <span v-if="exportLoading === 'pdf'" class="animate-spin w-3 h-3 border border-red-400 border-t-transparent rounded-full inline-block"></span>
            <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            PDF
          </button>

          <button @click="exportDOCX" :disabled="!!exportLoading"
            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-900/60 bg-blue-950/30 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-wait">
            <span v-if="exportLoading === 'docx'" class="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full inline-block"></span>
            <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            DOCX
          </button>
        </div>
      </div>

      <p class="text-[11px] text-slate-600">Export includes all logs matching current filters (all pages).</p>
    </div>

    <!-- ── Loading / Empty ─────────────────────────────────────────────────── -->
    <div v-if="loading" class="text-center py-12 text-slate-500">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mx-auto mb-4"></div>
      Loading logs...
    </div>
    <div v-else-if="logs.length === 0"
      class="text-center py-12 text-slate-500 bg-[#0B1120]/50 rounded-xl border border-dashed border-slate-800">
      No logs found
    </div>

    <!-- ── Log List ────────────────────────────────────────────────────────── -->
    <div v-else class="space-y-4">
      <div v-for="log in logs" :key="log.id"
        class="border border-slate-800/80 rounded-xl p-5 bg-[#0B1120] hover:border-slate-700 transition-colors">

        <!-- Header: badge + title | timestamp -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div class="flex items-center gap-4">
            <span :class="['text-[11px] font-bold px-2.5 py-1 rounded border tracking-wider', getBadgeColor(log.action)]">
              {{ getBadgeText(log.action) }}
            </span>
            <span class="text-[15px] font-medium text-slate-100">{{ getActionTitle(log) }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-[13px] text-slate-500 font-mono">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ new Date(log.created_at).toLocaleString('sk-SK') }}
          </div>
        </div>

        <!-- Admin info + IP -->
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-slate-400 mb-4 pb-4 border-b border-slate-800/60">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span>Performed by: <span class="font-medium text-slate-200">
              {{ log.user ? `${log.user.first_name ?? log.user.name} ${log.user.last_name ?? ''}`.trim() : 'System' }}
            </span></span>
          </div>

          <div v-if="log.user?.email" class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span class="font-mono text-slate-400">{{ log.user.email }}</span>
          </div>

          <div v-if="log.ip_address" class="flex items-center gap-2 ml-auto">
            <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
            <span class="font-mono text-[12px] text-slate-500">{{ log.ip_address }}</span>
          </div>
        </div>

        <!-- Details badges -->
        <div v-if="log.details && Object.keys(flattenDetails(log.details)).length > 0" class="flex flex-wrap gap-2">
          <span v-for="(value, key) in flattenDetails(log.details)" :key="key"
            class="text-[12px] inline-flex items-center gap-1.5 bg-[#111827] text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800/80">
            <span class="text-slate-500 capitalize">{{ formatKey(String(key)) }}:</span>
            <span class="font-semibold">{{ value }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- ── Pagination ──────────────────────────────────────────────────────── -->
    <div v-if="lastPage > 1" class="flex justify-center items-center gap-3 mt-8">
      <button @click="() => { page = Math.max(1, page - 1); fetchLogs() }" :disabled="page === 1"
        class="px-4 py-2 bg-[#0B1120] border border-slate-800 hover:border-slate-600 disabled:opacity-50 text-white text-sm rounded-lg transition-all">
        Previous
      </button>
      <span class="text-slate-500 text-sm font-medium">Page {{ page }} of {{ lastPage }}</span>
      <button @click="() => { page = Math.min(lastPage, page + 1); fetchLogs() }" :disabled="page === lastPage"
        class="px-4 py-2 bg-[#0B1120] border border-slate-800 hover:border-slate-600 disabled:opacity-50 text-white text-sm rounded-lg transition-all">
        Next
      </button>
    </div>
  </div>
</template>