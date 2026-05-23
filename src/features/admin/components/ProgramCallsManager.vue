<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '../../../shared/api/axios'

interface Program {
  id: number
  title?: string
  name?: string
  code: 'program_a' | 'program_b'
  description: string
}

interface Call {
  id: number
  program_id: number
  name: string
  status: 'draft' | 'open' | 'closed' | 'archived'
  opens_at: string | null
  deadline_at: string | null
  min_team_size: number
  max_team_size: number | null
}

interface RequiredDocument {
  document_name: string
  is_mandatory: boolean
  max_size_mb: number
}

const searchQuery = ref('')
const programs = ref<Program[]>([])
const calls = ref<Call[]>([])
const isSubmitting = ref(false)

const newCall = ref({
  program_type: 'a',
  title: '',
  status: 'draft',
  opens_at: '',
  deadline_at: '',
  min_team_size: 1,
  max_team_size: 5,
  evaluation_criteria: [],
  required_documents: [
    { document_name: 'Executive Summary', is_mandatory: true, max_size_mb: 10 },
    { document_name: 'Technical Architecture', is_mandatory: true, max_size_mb: 15 },
    { document_name: 'Roadmap', is_mandatory: true, max_size_mb: 5 },
    { document_name: 'Budget', is_mandatory: true, max_size_mb: 15 },
    { document_name: 'Risk Analysis', is_mandatory: true, max_size_mb: 15 },
    { document_name: 'Monetization Model', is_mandatory: true, max_size_mb: 15 }
  ] as RequiredDocument[]
})

const filteredCalls = computed(() => {
  return calls.value.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

function addDocument() {
  newCall.value.required_documents.push({ document_name: '', is_mandatory: true, max_size_mb: 5 })
}

function removeDocument(index: number) {
  newCall.value.required_documents.splice(index, 1)
}

const emit = defineEmits(['view-applications'])

async function loadData() {
  try {
    const [progRes, callRes] = await Promise.all([
      api.get<Program[]>('/admin/programs'),
      api.get<Call[]>('/admin/calls')
    ])
    programs.value = progRes.data
    calls.value = callRes.data
  } catch (e) {
    console.error("Error loading data", e)
  }
}

async function handleCreateCall() {
  try {
    isSubmitting.value = true
    const payload = {
      ...newCall.value,
      form_config: JSON.stringify(newCall.value.required_documents)
    }
    await api.post('/admin/calls', payload)
    alert('Call created successfully!')
    newCall.value.title = ''
    loadData()
  } catch (e) {
    alert('Error creating call.')
  } finally {
    isSubmitting.value = false
  }
}

async function updateCallStatus(id: number, status: string) {
  try {
    await api.patch(`/admin/calls/${id}/status`, { status })
    loadData()
  } catch {
    alert('Failed to update status')
  }
}

async function handleDeleteCall(id: number) {
  if (!confirm('Are you sure you want to delete this call?')) return
  try {
    await api.delete(`/admin/calls/${id}`)
    loadData()
  } catch {
    alert('Call cannot be deleted (only Draft).')
  }
}

async function downloadCallsExport(format: 'csv' | 'xlsx' = 'xlsx') {
  try {
    const params = { format }
    const response = await api.get('/admin/export/calls', {
      params,
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `calls.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error(`Error exporting calls to ${format.toUpperCase()}`, error)
    alert('Failed to download export.')
  }
}

onMounted(() => loadData())
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
    <div class="xl:col-span-1 border border-slate-800 bg-slate-900/40 rounded-2xl p-6">
      <h3 class="text-xl font-bold text-white mb-6">New Call</h3>
      <form @submit.prevent="handleCreateCall" class="space-y-4">
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Target Program</label>
          <select v-model="newCall.program_type" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none">
            <option 
              v-for="p in programs" 
              :key="p.id" 
              :value="p.code === 'program_b' ? 'b' : 'a'" 
              class="bg-slate-950 text-white"
            >
              {{ p.title || p.name || (p.code === 'program_a' ? 'Program A' : 'Program B') }}
            </option>
          </select>
        </div>
        
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Call Title</label>
          <input type="text" v-model="newCall.title" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Opens At</label>
            <input type="date" v-model="newCall.opens_at" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Deadline</label>
            <input type="date" v-model="newCall.deadline_at" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Min Team Size</label>
            <input type="number" v-model="newCall.min_team_size" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Max Team Size</label>
            <input type="number" v-model="newCall.max_team_size" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-2">Required Documents</label>
          <div class="space-y-3">
            <div v-for="(doc, index) in newCall.required_documents" :key="index" class="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <input v-model="doc.document_name" placeholder="Document Name" class="w-full bg-transparent border-b border-slate-700 mb-3 text-sm text-white focus:outline-none focus:border-blue-500" />
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" v-model="doc.is_mandatory" class="rounded bg-slate-900 border-slate-700 text-blue-600" /> Required
                </label>
                <div class="flex items-center gap-2">
                  <input v-model.number="doc.max_size_mb" type="number" class="w-12 bg-slate-800 rounded px-1 py-0.5 text-center text-xs text-white" />
                  <span class="text-[10px] text-slate-500">MB</span>
                  <button type="button" @click="removeDocument(index)" class="text-slate-500 hover:text-red-400 ml-2">✕</button>
                </div>
              </div>
            </div>
            <button type="button" @click="addDocument" class="w-full py-2 text-xs border border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition">
              + Add Document
            </button>
          </div>
        </div>

        <button type="submit" :disabled="isSubmitting" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition">
          {{ isSubmitting ? 'Saving...' : 'Create Call' }}
        </button>
      </form>
    </div>

    <div class="xl:col-span-2 space-y-6">
      <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-white">Active and Saved Calls</h3>
          <input v-model="searchQuery" placeholder="Search call..." class="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"/>
          <div class="ml-4 flex-shrink-0 gap-2 flex">
            <button @click="downloadCallsExport('csv')" class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono">Export CSV</button>
            <button @click="downloadCallsExport('xlsx')" class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono">Export XLSX</button>
          </div>
        </div>
        
        <div v-if="!filteredCalls.length" class="text-slate-500 italic text-sm">No calls found.</div>
        <div v-else class="space-y-4">
          <div v-for="c in filteredCalls" :key="c.id" class="border border-slate-800 bg-slate-950 p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex-grow">
              <div class="flex items-center gap-3 mb-1">
                <h4 class="text-lg font-bold text-white">{{ c.name }}</h4>
                <span :class="[
                  c.status === 'open' ? 'bg-green-950 text-green-400 border-green-800' : 
                  c.status === 'closed' ? 'bg-red-950 text-red-400 border-red-900' : 'bg-gray-800 text-gray-400 border-gray-700',
                  'text-[10px] px-2 py-0.5 rounded border font-mono uppercase'
                ]">{{ c.status }}</span>
              </div>
              <p class="text-xs text-slate-400">Team: {{ c.min_team_size }} - {{ c.max_team_size || '∞' }} people</p>
            </div>
            <div class="flex gap-2">
              <button @click="emit('view-applications', c.id)" class="text-xs bg-blue-900/20 hover:bg-blue-900/50 px-3 py-1.5 rounded border border-blue-800 text-blue-400 transition-all font-mono">Applications</button>

              <button v-if="c.status !== 'draft'" @click="updateCallStatus(c.id, 'draft')" class="text-xs bg-slate-800 px-3 py-1.5 rounded text-slate-300">Draft</button>
              <button v-if="c.status !== 'open'" @click="updateCallStatus(c.id, 'open')" class="text-xs bg-green-900/40 px-3 py-1.5 rounded text-green-400 border border-green-800">Open</button>
              <button v-if="c.status !== 'closed'" @click="updateCallStatus(c.id, 'closed')" class="text-xs bg-red-900/40 px-3 py-1.5 rounded text-red-400 border border-red-800">Close</button>
              <button @click="handleDeleteCall(c.id)" class="text-xs bg-red-950/30 hover:bg-red-950/60 px-3 py-1.5 rounded border border-red-900/50 text-red-400 transition-all font-mono">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>