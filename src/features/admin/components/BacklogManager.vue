<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  getAdminTasks,
  adminAdvanceTaskStatus,
  adminSetTaskStatus,
  getAdminUsers,
  exportTasks as exportTasksApi,
} from '@/features/admin/api/admin'
import { useConfirm } from '@/shared/composables/useConfirm'
import Pagination from '@/shared/components/Pagination.vue'
import type { AdminTask, AdminTaskStatus, AdminUser } from '@/features/admin/types/admin'

const { t, locale } = useI18n()

// ── list state ─────────────────────────────────────────────────────────────
const tasks        = ref<AdminTask[]>([])
const loading      = ref(false)
const actionLoading = ref<number | null>(null)
const message      = ref('')
const success      = ref(false)
const currentPage  = ref(1)
const totalPages   = ref(1)
const totalItems   = ref(0)
const searchQuery  = ref('')
const filterStatus = ref<AdminTaskStatus | ''>('')

// ── PO modal ────────────────────────────────────────────────────────────────
const poModal          = ref(false)
const poModalTask      = ref<AdminTask | null>(null)
const poUsers          = ref<AdminUser[]>([])
const poUsersLoading   = ref(false)
const selectedPoUserId = ref<number | null>(null)

// ── override modal ──────────────────────────────────────────────────────────
const overrideModal     = ref(false)
const overrideModalTask = ref<AdminTask | null>(null)
const overrideStatus    = ref<AdminTaskStatus>('in_matching')

// ── constants ───────────────────────────────────────────────────────────────
const STATUS_ORDER: AdminTaskStatus[] = [
  'published', 'in_matching', 'assigned', 'in_progress', 'closed',
]
const OVERRIDE_OPTIONS: AdminTaskStatus[] = [...STATUS_ORDER]
const FILTER_STATUS_OPTIONS: Array<AdminTaskStatus | ''> = ['', ...STATUS_ORDER]

// ── helpers ─────────────────────────────────────────────────────────────────
function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft:       'bg-slate-800/40 text-slate-400 border-slate-700/60',
    published:   'bg-blue-600/15 text-blue-400 border-blue-900/40',
    in_matching: 'bg-amber-950/40 text-amber-400 border-amber-900/40',
    assigned:    'bg-purple-950/40 text-purple-400 border-purple-900/40',
    in_progress: 'bg-cyan-950/40 text-cyan-400 border-cyan-900/40',
    closed:      'bg-slate-900 text-slate-500 border-slate-800',
  }
  return map[status] ?? 'bg-slate-800 text-slate-400 border-slate-700'
}

function nextStatus(current: string): AdminTaskStatus | null {
  const idx = STATUS_ORDER.indexOf(current as AdminTaskStatus)

  if (idx < 0 || idx >= STATUS_ORDER.length - 1) {
    return null
  }

  return STATUS_ORDER[idx + 1] ?? null
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(locale.value === 'sk' ? 'sk-SK' : 'en-US')
}

function setMessage(ok: boolean, text: string) {
  success.value = ok
  message.value = text
  setTimeout(() => { message.value = '' }, 3000)
}

// ── data ────────────────────────────────────────────────────────────────────
async function loadTasks() {
  loading.value = true
  try {
    const res = await getAdminTasks({
      status:   filterStatus.value || undefined,
      search:   searchQuery.value  || undefined,
      page:     currentPage.value,
      per_page: 20,
    })
    tasks.value      = res.data?.data ?? res.data ?? []
    totalPages.value = res.data?.last_page ?? 1
    totalItems.value = res.data?.total ?? tasks.value.length
    currentPage.value = res.data?.current_page ?? currentPage.value
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

function handleFilterChange() {
  currentPage.value = 1
  loadTasks()
}

let searchTimeout: number
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = window.setTimeout(handleFilterChange, 400)
})
watch(filterStatus, handleFilterChange)

// ── export ──────────────────────────────────────────────────────────────────
async function exportTasks(format: 'csv' | 'xlsx') {
  loading.value = true
  try {
    const res = await exportTasksApi({
      status: filterStatus.value || undefined,
      search: searchQuery.value  || undefined,
      format,
    })
    const url  = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href  = url
    link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setMessage(true, t('admin.backlog.messages.exportSuccess', { format: format.toUpperCase() }))
  } catch {
    setMessage(false, t('admin.backlog.messages.exportFailed'))
  } finally {
    loading.value = false
  }
}

// ── advance ──────────────────────────────────────────────────────────────────
async function handleAdvance(task: AdminTask) {
  const next = nextStatus(task.status)
  if (!next) return

  if (next === 'assigned') {
    poModalTask.value      = task
    selectedPoUserId.value = task.product_owner_user_id ?? null
    poModal.value          = true
    await loadPoUsers()
    return
  }

  const ok = await useConfirm({
    title:   t('admin.backlog.confirmAdvanceTitle'),
    message: t('admin.backlog.confirmAdvanceMsg', { status: t(`admin.backlog.status.${next}`) }),
  })
  if (!ok) return

  actionLoading.value = task.id
  try {
    await adminAdvanceTaskStatus(task.id)
    await loadTasks()
  } catch (e) { console.error(e) }
  finally     { actionLoading.value = null }
}

async function loadPoUsers() {
  poUsersLoading.value = true
  try {
    const res  = await getAdminUsers({ per_page: 200 })
    poUsers.value = (res.data?.data ?? res.data ?? []) as AdminUser[]
  } catch { poUsers.value = [] }
  finally  { poUsersLoading.value = false }
}

async function confirmAdvanceWithPo() {
  if (!poModalTask.value) return
  actionLoading.value = poModalTask.value.id
  poModal.value       = false
  try {
    await adminAdvanceTaskStatus(poModalTask.value.id, selectedPoUserId.value ?? undefined)
    await loadTasks()
  } catch (e) { console.error(e) }
  finally {
    actionLoading.value = null
    poModalTask.value   = null
    selectedPoUserId.value = null
  }
}

// ── override ─────────────────────────────────────────────────────────────────
function openOverrideModal(task: AdminTask) {
  overrideModalTask.value = task
  overrideStatus.value    = task.status as AdminTaskStatus
  overrideModal.value     = true
}

async function confirmOverride() {
  if (!overrideModalTask.value) return
  actionLoading.value = overrideModalTask.value.id
  overrideModal.value = false
  try {
    await adminSetTaskStatus(overrideModalTask.value.id, overrideStatus.value)
    await loadTasks()
  } catch (e) { console.error(e) }
  finally {
    actionLoading.value     = null
    overrideModalTask.value = null
  }
}

onMounted(loadTasks)
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">

    <!-- Toast -->
    <div v-if="message" :class="[
      'p-3 rounded-lg text-sm mb-6 border',
      success
        ? 'bg-green-900/20 border-green-800 text-green-400'
        : 'bg-red-900/20 border-red-800 text-red-400'
    ]">{{ message }}</div>

    <!-- Header -->
    <div class="flex flex-col gap-4 mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-xl font-bold text-white">{{ t('admin.backlog.title') }}</h3>
          <p class="text-sm text-slate-500 mt-1">{{ t('admin.backlog.subtitle') }}</p>
        </div>
        <div class="flex-shrink-0 flex gap-2">
          <button
            @click="exportTasks('csv')"
            :disabled="loading"
            class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono disabled:opacity-50"
          >{{ t('admin.backlog.exportCsv') }}</button>
          <button
            @click="exportTasks('xlsx')"
            :disabled="loading"
            class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono disabled:opacity-50"
          >{{ t('admin.backlog.exportXlsx') }}</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center w-full">
        <div class="sm:col-span-2">
          <input
            v-model="searchQuery"
            :placeholder="t('admin.backlog.searchPlaceholder')"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
          />
        </div>
        <div>
          <select
            v-model="filterStatus"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer"
          >
            <option value="">{{ t('admin.backlog.allStatuses') }}</option>
            <option v-for="s in STATUS_ORDER" :key="s" :value="s">
              {{ t(`admin.backlog.status.${s}`) }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-slate-500 animate-pulse py-4 font-mono text-sm">
      {{ t('admin.backlog.loadingTasks') }}
    </div>

    <!-- Table -->
    <div class="overflow-x-auto" v-else>
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
          <tr>
            <th class="px-4 py-3 rounded-tl-lg">{{ t('admin.backlog.tableHeaders.task') }}</th>
            <th class="px-4 py-3">{{ t('admin.backlog.tableHeaders.organization') }}</th>
            <th class="px-4 py-3">{{ t('admin.backlog.tableHeaders.status') }}</th>
            <th class="px-4 py-3">{{ t('admin.backlog.tableHeaders.budget') }}</th>
            <th class="px-4 py-3">{{ t('admin.backlog.tableHeaders.po') }}</th>
            <th class="px-4 py-3">{{ t('admin.backlog.tableHeaders.deadline') }}</th>
            <th class="px-4 py-3 rounded-tr-lg text-right">{{ t('admin.backlog.tableHeaders.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="task in tasks"
            :key="task.id"
            class="border-b border-slate-800 hover:bg-slate-800/30 transition"
          >
            <!-- Task -->
            <td class="px-4 py-3">
              <div class="font-semibold text-white text-sm">{{ task.title }}</div>
              <div class="text-xs text-slate-500 font-mono mt-0.5">#{{ task.id }}</div>
            </td>

            <!-- Organization -->
            <td class="px-4 py-3">
              <span class="text-sm text-slate-300">{{ task.organization?.name ?? '—' }}</span>
            </td>

            <!-- Status -->
            <td class="px-4 py-3">
              <span :class="['text-xs px-2 py-1 rounded border font-mono uppercase whitespace-nowrap', statusColor(task.status)]">
                {{ t(`admin.backlog.status.${task.status}`) }}
              </span>
            </td>

            <!-- Budget -->
            <td class="px-4 py-3">
              <span class="text-sm text-slate-300 font-mono">
                {{ task.budget ? `€${Number(task.budget).toLocaleString()}` : '—' }}
              </span>
            </td>

            <!-- PO -->
            <td class="px-4 py-3">
              <span v-if="task.product_owner" class="text-xs text-slate-400">
                {{ [task.product_owner.first_name, task.product_owner.last_name].filter(Boolean).join(' ') || task.product_owner.email }}
              </span>
              <span v-else class="text-xs text-slate-600">—</span>
            </td>

            <!-- Deadline -->
            <td class="px-4 py-3">
              <span class="text-xs text-slate-400 font-mono">{{ formatDate(task.call?.deadline_at) }}</span>
            </td>

            <!-- Actions -->
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="nextStatus(task.status)"
                  :disabled="actionLoading === task.id"
                  @click="handleAdvance(task)"
                  class="text-xs px-3 py-1 rounded border bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 border-blue-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {{ actionLoading === task.id ? '...' : `→ ${t(`admin.backlog.status.${nextStatus(task.status)!}`)}` }}
                </button>
                <button
                  :disabled="actionLoading === task.id"
                  @click="openOverrideModal(task)"
                  class="text-xs px-3 py-1 rounded border bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white border-slate-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {{ t('admin.backlog.actions.override') }}
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="tasks.length === 0">
            <td colspan="7" class="px-4 py-10 text-center text-slate-500 italic text-sm">
              {{ t('admin.backlog.noTasksFound') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :loading="loading"
      @change="(p) => { currentPage = p; loadTasks() }"
      class="mt-6"
    />

  </div>

  <!-- PO assignment modal -->
  <div
    v-if="poModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    @click.self="poModal = false"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
      <h3 class="text-xl font-bold text-white mb-2">{{ t('admin.backlog.poModalTitle') }}</h3>
      <p class="text-slate-400 text-sm mb-6">{{ t('admin.backlog.poModalSubtitle') }}</p>

      <div v-if="poUsersLoading" class="text-slate-500 animate-pulse text-sm py-2">
        {{ t('admin.backlog.loadingUsers') }}
      </div>
      <select
        v-else
        v-model="selectedPoUserId"
        class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600 transition-all mb-6"
      >
        <option :value="null">{{ t('admin.backlog.poNone') }}</option>
        <option v-for="u in poUsers" :key="u.id" :value="u.id">
          {{ [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email }}
        </option>
      </select>

      <div class="flex gap-3">
        <button
          @click="poModal = false"
          class="flex-1 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >{{ t('admin.backlog.cancel') }}</button>
        <button
          @click="confirmAdvanceWithPo"
          class="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-900/20"
        >{{ t('admin.backlog.confirmAssign') }}</button>
      </div>
    </div>
  </div>

  <!-- Override status modal -->
  <div
    v-if="overrideModal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    @click.self="overrideModal = false"
  >
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
      <h3 class="text-xl font-bold text-white mb-2">{{ t('admin.backlog.overrideModalTitle') }}</h3>
      <p class="text-slate-400 text-sm mb-6">{{ overrideModalTask?.title }}</p>

      <select
        v-model="overrideStatus"
        class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 transition-all mb-6"
      >
        <option v-for="s in OVERRIDE_OPTIONS" :key="s" :value="s">
          {{ t(`admin.backlog.status.${s}`) }}
        </option>
      </select>

      <div class="flex gap-3">
        <button
          @click="overrideModal = false"
          class="flex-1 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition"
        >{{ t('admin.backlog.cancel') }}</button>
        <button
          @click="confirmOverride"
          class="flex-1 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-amber-900/20"
        >{{ t('admin.backlog.confirmOverride') }}</button>
      </div>
    </div>
  </div>
</template>