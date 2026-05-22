<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/shared/api/axios'

interface DocumentRequirement {
  document_name: string
  is_mandatory: boolean
  max_size_mb: number
}

interface ActiveCall {
  id: number
  title: string
  status: 'draft' | 'open' | 'closed'
  deadline_at: string | null
  min_team_size: number
  max_team_size: number | null
  form_config: string // Отримуємо як рядок JSON з сервера
}

const router = useRouter()
const activeCall = ref<ActiveCall | null>(null)
const parsedDocuments = ref<DocumentRequirement[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    // Отримуємо активний та відкритий виклик для Програми А з бекенду
    const res = await api.get<ActiveCall[]>('/calls/active?program=a')
    if (res.data && res.data.length > 0) {
      const firstActiveCall = res.data[0]
      if (firstActiveCall) {
        activeCall.value = firstActiveCall

        // Розбір JSON schema конфігурації документів, заданих адміном
        if (activeCall.value.form_config) {
          try {
            parsedDocuments.value = JSON.parse(activeCall.value.form_config) as DocumentRequirement[]
          } catch {
            parsedDocuments.value = []
          }
        }
      }
    }
  } finally {
    loading.value = false
  }
})

const goToUpload = () => {
  router.push('/programs/a/upload')
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="px-20 py-10 bg-slate-950 text-slate-100 min-h-screen relative overflow-hidden">
    <div class="bg-blue-950 absolute rounded-[100%] h-120 w-120 -z-10 -right-30 -top-10 blur-3xl opacity-40"></div>

    <div class="pb-20 mb-12">
      <div class="bg-blue-600 text-blue-100 text-xs font-bold text-center py-1 rounded-xl w-32 mb-5">PROGRAM A</div>
      <h1 class="font-bold text-5xl text-left leading-tight text-white">
        Grant Incubation<br> 
        <span class="text-blue-400">Program</span>
      </h1>
      <p class="text-gray-300 max-w-2xl mt-7 mb-8 leading-relaxed">
        Turn your innovative idea into a reality. Program A is designed for teams aiming to build a startup or a unique product. We provide the funding, expert mentoring, and technical resources needed to accelerate your project to the market.
      </p>

      <div v-if="loading" class="text-slate-500 text-sm font-mono">Overovanie stavu výzvy...</div>
      
      <div v-else-if="activeCall && activeCall.status === 'open'" class="space-y-4">
        <div class="text-sm text-green-400 flex items-center gap-2 font-mono">
          <span class="w-2 py-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Výzva "{{ activeCall.title }}" je otvorená do: <span class="font-bold text-white">{{ formatDate(activeCall.deadline_at) }}</span>
        </div>
        <div class="flex gap-4">
          <button @click="goToUpload" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition shadow-lg shadow-blue-900/30">
            Submit Application
          </button>
          <button class="border border-slate-700 hover:border-slate-500 text-slate-300 px-8 py-3 rounded-lg font-medium transition">
            Learn more
          </button>
        </div>
      </div>

      <div v-else class="bg-red-950/20 border border-red-900/50 rounded-2xl p-5 max-w-2xl text-red-400 text-sm">
        <span class="font-bold uppercase tracking-wider block mb-1">Prihlasovanie zatvorené</span>
        Momentálne nie je otvorená žiadna aktívna výzva pre Program A. Sledujte administráciu pre nasledujúce jarné/jesenné kolá.
      </div>
    </div>

    <section class="justify-left mb-24">
      <div class="text-xs font-mono uppercase tracking-widest text-blue-500 mb-2">Application process</div>
      <h2 class="text-3xl font-medium mb-10 text-white">How does it work?</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/40">
          <div class="text-5xl font-bold text-blue-500">1.</div> 
          <h3 class="text-lg font-bold text-white mt-4 mb-2">Register Team</h3>
          <div class="text-slate-400 text-sm leading-relaxed">
            Form a team of at least <span class="text-blue-400 font-bold font-mono">{{ activeCall?.min_team_size || 3 }}</span> members inside your profile.
          </div>
        </div>
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/40">
          <div class="text-5xl font-bold text-blue-500">2.</div>
          <h3 class="text-lg font-bold text-white mt-4 mb-2">Submit Proposal</h3>
          <div class="text-slate-400 text-sm leading-relaxed">
            Upload all dynamic attachments specified by the administration configuration form schema.
          </div>
        </div>
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/40">
          <div class="text-5xl font-bold text-blue-500">3.</div> 
          <h3 class="text-lg font-bold text-white mt-4 mb-2">Evaluation</h3>
          <div class="text-slate-400 text-sm leading-relaxed">
            Your uploaded package will undergo formal validation and technical verification by the expert commission.
          </div>
        </div>
        <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/40">
          <div class="text-5xl font-bold text-blue-500">4.</div> 
          <h3 class="text-lg font-bold text-white mt-4 mb-2">Incubation</h3>
          <div class="text-slate-400 text-sm leading-relaxed">
            Upon formal approval, receive grant funding, get assigned an agile mentor, and start building.
          </div>
        </div>
      </div>
    </section>

    <section v-if="parsedDocuments.length" class="border-t border-slate-900 pt-16">
      <div class="text-xs font-mono uppercase tracking-widest text-blue-500 mb-2">Attachments configuration</div>
      <h2 class="text-3xl font-semibold text-white mb-8">Required documentation according to current open call</h2>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="(doc, idx) in parsedDocuments" :key="doc.document_name" class="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 flex flex-col justify-between">
          <div>
            <p class="text-xs font-mono text-slate-600">SPEC_0{{ idx + 1 }}</p>
            <h3 class="mt-2 text-lg font-bold text-white">{{ doc.document_name }}</h3>
          </div>
          <div class="mt-4 flex gap-2">
            <span :class="doc.is_mandatory ? 'bg-red-500/10 text-red-400 border-red-900/40' : 'bg-slate-800 text-slate-400 border-slate-700'" class="text-xs px-2 py-0.5 rounded border">
              {{ doc.is_mandatory ? 'Mandatory' : 'Optional' }}
            </span>
            <span class="bg-blue-950/50 text-blue-400 border border-blue-900/50 text-xs px-2 py-0.5 rounded">
              Max {{ doc.max_size_mb }} MB
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>