<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/shared/api/axios'

const props = defineProps<{
  filterCallId?: number | null
}>()

interface Application {
  id: number
  call_id: number
  call_name: string
  applicant_name: string
  team_name: string
  status: 'draft' | 'submitted' | 'formal_check' | 'evaluation' | 'approved' | 'rejected' | 'needs_info'
  submitted_at: string
}

const applications = ref<Application[]>([])
const loading = ref(false)
const searchQuery = ref('')

async function loadApplications() {
  loading.value = true
  try {
    const params = props.filterCallId ? { call_id: props.filterCallId } : {}
    const res = await api.get('/admin/applications', { params })
    applications.value = res.data
  } catch (error) {
    console.error('Failed to load applications', error)
  } finally {
    loading.value = false
  }
}

async function changeStatus(id: number, newStatus: string) {
  try {
    await api.patch(`/admin/applications/${id}/status`, { status: newStatus })
    const app = applications.value.find(a => a.id === id)
    if (app) app.status = newStatus as any
  } catch (error) {
    alert('Chyba pri zmene statusu')
  }
}

async function downloadExport(format: 'csv' | 'xlsx' = 'xlsx') {
  try {
    const params: any = { format }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
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
  } catch (error) {
    console.error(`Chyba pri exporte do ${format.toUpperCase()}`, error)
    alert('Nepodarilo sa stiahnuť export.')
  }
}

onMounted(loadApplications)
watch(() => props.filterCallId, loadApplications)
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h3 class="text-xl font-bold text-white">Správa Prihlášok (Applications)</h3>
        <p v-if="filterCallId" class="text-sm text-blue-400 mt-1 flex items-center gap-2">
          <span>Filtrované pre Výzvu ID: {{ filterCallId }}</span>
          <button @click="$emit('clear-filter')" class="text-slate-500 hover:text-slate-300 underline text-xs">Zrušiť filter</button>
        </p>
      </div>
      <input v-model="searchQuery" placeholder="Hľadať tím alebo žiadateľa..." class="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"/>
      <div class="ml-4 flex-shrink-0">
        <button @click="downloadExport('csv')" class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono">Export CSV</button>
        <button @click="downloadExport('xlsx')" class="ml-2 text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono">Export XLSX</button>
      </div>
    </div>

    <div v-if="loading" class="text-slate-500 animate-pulse">Načítavam dáta...</div>
    
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
          <tr>
            <th class="px-4 py-3 rounded-tl-lg">ID</th>
            <th class="px-4 py-3">Tím / Žiadateľ</th>
            <th class="px-4 py-3">Výzva</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3 rounded-tr-lg text-right">Akcie</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in applications" :key="app.id" class="border-b border-slate-800 hover:bg-slate-800/30 transition">
            <td class="px-4 py-4 font-mono text-slate-500">#{{ app.id }}</td>
            <td class="px-4 py-4">
              <div class="font-bold text-white">{{ app.team_name }}</div>
              <div class="text-xs text-slate-500">{{ app.applicant_name }}</div>
            </td>
            <td class="px-4 py-4 text-xs">{{ app.call_name }}</td>
            <td class="px-4 py-4">
              <span :class="{
                'bg-slate-800 text-slate-400 border-slate-700': app.status === 'draft',
                'bg-blue-900/40 text-blue-400 border-blue-800': app.status === 'submitted',
                'bg-yellow-900/40 text-yellow-400 border-yellow-800': app.status === 'formal_check',
                'bg-green-900/40 text-green-400 border-green-800': app.status === 'approved',
                'bg-red-900/40 text-red-400 border-red-800': app.status === 'rejected',
                'bg-purple-900/40 text-purple-400 border-purple-800': app.status === 'needs_info',
              }" class="text-[10px] px-2 py-1 rounded border font-mono uppercase whitespace-nowrap">
                {{ app.status }}
              </span>
            </td>
            <td class="px-4 py-4 text-right space-x-2">
              <button class="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-white transition">
                Detail
              </button>
              <button v-if="app.status === 'submitted'" @click="changeStatus(app.id, 'formal_check')" class="text-xs bg-yellow-900/20 hover:bg-yellow-900/50 px-3 py-1.5 rounded border border-yellow-800/50 text-yellow-400 transition">
                Overiť formálne
              </button>
              <button v-if="app.status === 'formal_check'" @click="changeStatus(app.id, 'approved')" class="text-xs bg-green-900/20 hover:bg-green-900/50 px-3 py-1.5 rounded border border-green-800/50 text-green-400 transition">
                Schváliť
              </button>
            </td>
          </tr>
          <tr v-if="applications.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-slate-500 italic">Žiadne prihlášky neboli nájdené.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>