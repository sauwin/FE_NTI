<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/shared/api/axios'

const props = defineProps<{
  filterCallId?: number | null
}>()

defineEmits(['clear-filter'])

interface Application {
  id: number
  applicant_name: string
  applicant_email: string
  program: string
  program_type: string
  call_name: string
  datum: string
  status: string
}

const ALL_STATUSES = [
  { value: 'draft',              label: 'Draft',              color: 'text-slate-400' },
  { value: 'submitted',          label: 'Submitted',          color: 'text-blue-400' },
  { value: 'formally_verified',  label: 'Formally Verified',  color: 'text-yellow-400' },
  { value: 'under_evaluation',   label: 'Under Evaluation',   color: 'text-indigo-400' },
  { value: 'pending_revision',   label: 'Pending Revision',   color: 'text-purple-400' },
  { value: 'approved',           label: 'Approved',           color: 'text-green-400' },
  { value: 'rejected',           label: 'Rejected',           color: 'text-red-400' },
  { value: 'onboarding',         label: 'Onboarding',         color: 'text-orange-400' },
  { value: 'active',             label: 'Active',             color: 'text-emerald-400' },
  { value: 'suspended',          label: 'Suspended',          color: 'text-rose-400' },
  { value: 'closed',             label: 'Closed',             color: 'text-rose-600' },
]

const applications = ref<Application[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const searchQuery = ref('')
const changingStatusId = ref<number | null>(null)

async function loadApplications() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value }
    if (props.filterCallId) params.call_id = props.filterCallId
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()

    const res = await api.get('/admin/applications', { params })

    if (res.data && res.data.data) {
      applications.value = res.data.data
      currentPage.value = res.data.current_page
      totalPages.value = res.data.last_page
      totalItems.value = res.data.total
    } else {
      applications.value = Array.isArray(res.data) ? res.data : []
      totalPages.value = 1
      totalItems.value = applications.value.length
    }
  } catch (error) {
    console.error('Failed to load applications', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadApplications()
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadApplications()
}


async function changeStatus(id: number, newStatus: string) {
  changingStatusId.value = id
  try {
    await api.patch(`/admin/applications/${id}/status`, { status: newStatus })
    const app = applications.value.find(a => a.id === id)
    if (app) app.status = newStatus
  } catch {
    alert('Chyba pri zmene statusu')
  } finally {
    changingStatusId.value = null
  }
}

async function downloadExport(format: 'csv' | 'xlsx' = 'xlsx') {
  try {
    const params: any = { format }
    if (searchQuery.value) params.search = searchQuery.value
    if (props.filterCallId) params.call_id = props.filterCallId

    const response = await api.get('/admin/export/applications', {
      params,
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `applications.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    alert('Nepodarilo sa stiahnuť export.')
  }
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft:             'bg-slate-800 text-slate-400 border-slate-700',
    submitted:         'bg-blue-900/40 text-blue-400 border-blue-800',
    formal_check:      'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    formally_verified: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    evaluation:        'bg-indigo-900/40 text-indigo-400 border-indigo-800',
    under_evaluation:  'bg-indigo-900/40 text-indigo-400 border-indigo-800',
    approved:          'bg-green-900/40 text-green-400 border-green-800',
    active:            'bg-emerald-900/40 text-emerald-400 border-emerald-800',
    rejected:          'bg-red-900/40 text-red-400 border-red-800',
    needs_info:        'bg-purple-900/40 text-purple-400 border-purple-800',
    pending_revision:  'bg-purple-900/40 text-purple-400 border-purple-800',
    onboarding:        'bg-orange-900/40 text-orange-400 border-orange-800',
    suspended:         'bg-rose-900/40 text-rose-400 border-rose-800',
    closed:            'bg-rose-900/40 text-rose-600 border-rose-900',
  }
  return map[status] ?? 'bg-slate-800 text-slate-400 border-slate-700'
}

onMounted(() => {
  loadApplications()
})

watch(() => props.filterCallId, () => {
  currentPage.value = 1
  loadApplications()
})
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h3 class="text-xl font-bold text-white">Správa Prihlášok</h3>
        <p v-if="filterCallId" class="text-sm text-blue-400 mt-1 flex items-center gap-2">
          <span>Filtrované pre Výzvu ID: {{ filterCallId }}</span>
          <button @click="$emit('clear-filter')" class="text-slate-500 hover:text-slate-300 underline text-xs cursor-pointer">Zrušiť filter</button>
        </p>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="Hľadať podľa mena alebo emailu..."
          class="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
        />
        <div class="ml-4 flex-shrink-0 gap-2 flex">
          <button @click="downloadExport('csv')" :disabled="loading" class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono">
            Export CSV
          </button>
          <button @click="downloadExport('xlsx')" :disabled="loading" class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono">
            Export XLSX
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="text-slate-500 animate-pulse py-4 font-mono text-sm">Načítavam dáta...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
          <tr>
            <th class="px-4 py-3 rounded-tl-lg">ID</th>
            <th class="px-4 py-3">Uchádzač</th>
            <th class="px-4 py-3">Program / Výzva</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3 rounded-tr-lg text-right">Akcie</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="app in applications"
            :key="app.id"
            class="border-b border-slate-800 hover:bg-slate-800/30 transition"
          >
            <td class="px-4 py-4 font-mono text-slate-500">#{{ app.id }}</td>

            <td class="px-4 py-4">
              <div class="font-semibold text-white">{{ app.applicant_name }}</div>
              <div class="text-xs text-slate-500 font-mono">{{ app.applicant_email }}</div>
            </td>

            <td class="px-4 py-4">
              <div class="text-white font-medium text-xs">
                <span class="font-mono px-1.5 py-0.5 rounded border text-[10px] mr-1"
                  :class="app.program_type === 'A'
                    ? 'bg-blue-950/60 text-blue-400 border-blue-900'
                    : 'bg-indigo-950/60 text-indigo-400 border-indigo-900'">
                  Program {{ app.program_type }}
                </span>
              </div>
              <div class="text-slate-500 text-xs mt-1">{{ app.call_name }}</div>
            </td>

            <td class="px-4 py-4">
              <span
                :class="statusColor(app.status)"
                class="text-[10px] px-2 py-1 rounded border font-mono uppercase whitespace-nowrap"
              >
                {{ changingStatusId === app.id ? '...' : app.status }}
              </span>
            </td>

            <td class="px-4 py-4 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-2">
                <!-- Detail button -->
                <button class="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 text-slate-300 transition cursor-pointer">
                  Detail
                </button>

                <!-- Status select inline -->
                <select
                  :value="app.status"
                  @change="changeStatus(app.id, ($event.target as HTMLSelectElement).value)"
                  :disabled="changingStatusId === app.id"
                  class="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded px-2 py-1.5 cursor-pointer outline-none focus:border-slate-500 transition disabled:opacity-50"
                >
                  <option v-for="s in ALL_STATUSES" :key="s.value" :value="s.value" class="bg-slate-900">
                    {{ s.label }}
                  </option>
                </select>
              </div>
            </td>
          </tr>

          <tr v-if="applications.length === 0">
            <td colspan="5" class="px-4 py-10 text-center text-slate-500 italic text-sm">
              Žiadne prihlášky neboli nájdené.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-3">
      <button
        v-if="currentPage > 1"
        @click="changePage(currentPage - 1)"
        class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded border border-slate-700 transition cursor-pointer"
      >
        ← Prev
      </button>
      <span class="text-sm text-slate-400 font-mono">
        {{ currentPage }} / {{ totalPages }}
        <span class="text-slate-600 ml-1">({{ totalItems }})</span>
      </span>
      <button
        v-if="currentPage < totalPages"
        @click="changePage(currentPage + 1)"
        class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded border border-slate-700 transition cursor-pointer"
      >
        Next →
      </button>
    </div>
  </div>
</template>