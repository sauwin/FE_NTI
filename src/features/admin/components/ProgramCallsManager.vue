<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../../shared/api/axios'

interface Program {
  id: number
  title: string
  code: 'program_a' | 'program_b'
  description: string
}

interface Call {
  id: number
  program_id: number
  title: string
  status: 'draft' | 'open' | 'closed'
  opens_at: string | null
  deadline_at: string | null
  min_team_size: number
  max_team_size: number | null
  form_config: string // Зберігається як JSON-string у БД
}

interface CallPayload {
  program_type: 'a' | 'b'
  title: string
  status: 'draft' | 'open' | 'closed' | 'archived'
  opens_at: string | null
  deadline_at: string | null
  min_team_size: number
  max_team_size: number | null
  evaluation_criteria: unknown[]
  required_documents: unknown[]
  form_config: string
}

const programs = ref<Program[]>([])
const calls = ref<Call[]>([])
const isSubmitting = ref(false)

// Стан форми створення виклику (Call)
const newCall = ref<CallPayload>({
  program_type: 'a',
  title: '',
  status: 'draft',
  opens_at: '',
  deadline_at: '',
  min_team_size: 1,
  max_team_size: 5,
  evaluation_criteria: [],
  required_documents: [],
  form_config: JSON.stringify([
    { document_name: 'Executive Summary', is_mandatory: true, max_size_mb: 10 },
    { document_name: 'Technical Architecture', is_mandatory: true, max_size_mb: 15 },
    { document_name: 'Roadmap', is_mandatory: true, max_size_mb: 5 }
  ], null, 2) // Default JSON schema config
})

async function loadData() {
  try {
    const progRes = await api.get<Program[]>('/admin/programs')
    programs.value = progRes.data
    const firstProgram = programs.value[0]
    if (firstProgram) {
      newCall.value.program_type = firstProgram.code === 'program_b' ? 'b' : 'a'
    }

    const callRes = await api.get<Call[]>('/admin/calls')
    calls.value = callRes.data
  } catch {
  }
}

async function handleCreateCall() {
  try {
    // Валідація JSON структури перед відправкою на сервер
    JSON.parse(newCall.value.form_config)
    
    isSubmitting.value = true
    await api.post('/admin/calls', newCall.value)
    alert('Výzva bola úspešne vytvorená!')
    loadData()
  } catch (e) {
    alert('Chyba: Neplatný formát JSON configu alebo sieťová chyba.');
  } finally {
    isSubmitting.value = false
  }
}

async function updateCallStatus(callId: number, status: Call['status']) {
  try {
    await api.patch(`/admin/calls/${callId}/status`, { status })
    loadData()
  } catch (err) {
    alert('Failed to update status')
  }
}

onMounted(() => loadData())
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
    <div class="xl:col-span-1 border border-slate-800 bg-slate-900/40 rounded-2xl p-6">
      <h3 class="text-xl font-bold text-white mb-6">Novú Výzvu (Create Call)</h3>
      <form @submit.prevent="handleCreateCall" class="space-y-4">
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Target Program</label>
          <select v-model="newCall.program_type" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white">
            <option v-for="p in programs" :key="p.id" :value="p.code === 'program_b' ? 'b' : 'a'">{{ p.title }} ({{ p.code }})</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Call Title</label>
          <input type="text" v-model="newCall.title" placeholder="E.g. Jarná Výzva 2026" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Min Team Size</label>
            <input type="number" v-model="newCall.min_team_size" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
          </div>
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Max Team Size</label>
            <input type="number" v-model="newCall.max_team_size" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Opens At</label>
            <input type="datetime-local" v-model="newCall.opens_at" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white" />
          </div>
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Deadline At</label>
            <input type="datetime-local" v-model="newCall.deadline_at" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Dynamická definícia formulára (JSON Config)</label>
          <textarea v-model="newCall.form_config" rows="8" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-cyan-400"></textarea>
        </div>

        <button type="submit" :disabled="isSubmitting" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50">
          {{ isSubmitting ? 'Ukladám...' : 'Vytvoriť a uložiť Výzvu' }}
        </button>
      </form>
    </div>

    <div class="xl:col-span-2 space-y-6">
      <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
        <h3 class="text-xl font-bold text-white mb-4">Aktívne a uložené Výzvy (Calls Lifecycle)</h3>
        
        <div v-if="!calls.length" class="text-slate-500 italic text-sm">Žiadne výzvy neboli definované.</div>
        <div v-else class="space-y-4">
          <div v-for="c in calls" :key="c.id" class="border border-slate-800 bg-slate-950 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h4 class="text-lg font-bold text-white">{{ c.title }}</h4>
                <span :class="[
                  c.status === 'open' ? 'bg-green-950 text-green-400 border-green-800' : 
                  c.status === 'closed' ? 'bg-red-950 text-red-400 border-red-900' : 
                  'bg-gray-800 text-gray-400 border-gray-700',
                  'text-xs px-2 py-0.5 rounded border font-mono uppercase'
                ]">{{ c.status }}</span>
              </div>
              <p class="text-xs text-slate-400">
                Program ID: <span class="text-slate-200 font-mono">{{ c.program_id }}</span> | 
                Tím: <span class="text-slate-200 font-mono">{{ c.min_team_size }} - {{ c.max_team_size || '∞' }} osôb</span>
              </p>
              <p class="text-xs text-slate-500 mt-1" v-if="c.deadline_at">
                Deadline: <span class="text-blue-400">{{ new Date(c.deadline_at).toLocaleString() }}</span>
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button v-if="c.status !== 'draft'" @click="updateCallStatus(c.id, 'draft')" class="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-slate-300">Draft</button>
              <button v-if="c.status !== 'open'" @click="updateCallStatus(c.id, 'open')" class="text-xs bg-green-900/40 hover:bg-green-900/70 px-3 py-1.5 rounded text-green-400 border border-green-800">Open Call</button>
              <button v-if="c.status !== 'closed'" @click="updateCallStatus(c.id, 'closed')" class="text-xs bg-red-900/40 hover:bg-red-900/70 px-3 py-1.5 rounded text-red-400 border border-red-800">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>