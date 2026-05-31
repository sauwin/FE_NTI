<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getActiveCalls } from '@/shared/api/calls'
import type { ActiveCall } from '@/shared/types/calls'

import PageHero from '@/shared/ui/PageHero.vue'

const router = useRouter()
const activeCall = ref<ActiveCall | null>(null)
const parsedDocuments = ref<string[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getActiveCalls('a')
    console.log(res)
    
    if (res.data[0]) {
      activeCall.value = res.data[0]
      parsedDocuments.value = res.data[0].required_documents || []
    }
  } catch (error) {
    console.error('Error fetching active call:', error)
    parsedDocuments.value = []
  } finally {
    loading.value = false
  }
})

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

const parseDocName = (docName:string) => {
  return docName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<template>
  <div class="bg-blue-950 absolute rounded-[100%] h-120 w-120 -z-10 -right-30 -top-10 blur-3xl opacity-40"></div>

  <PageHero
    badge="Program A"
    title="Grant Incubation"
    highlight="Program"
    description="Turn your innovative idea into a reality. Program A is designed for teams aiming to build a startup or a unique product. We provide the funding, expert mentoring, and technical resources needed to accelerate your project to the market."
  >
    <div v-if="loading" class="text-slate-500 text-sm font-mono mt-4">Overovanie stavu výzvy...</div>
    
    <div v-else-if="activeCall && activeCall.status === 'open'" class="space-y-4 mt-4">
      <div class="text-sm text-green-400 flex items-center gap-2 font-mono">
        <span class="w-2 py-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Výzva "{{ activeCall.name }}" je otvorená do: <span class="font-bold text-white">{{ formatDate(activeCall.deadline_at) }}</span>
      </div>
      <div class="flex gap-4">
        <button @click="router.push('/programs/a/upload')" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition shadow-lg shadow-blue-900/30">
          Submit Application
        </button>
        <button class="border border-slate-700 hover:border-slate-500 text-slate-300 px-8 py-3 rounded-lg font-medium transition">
          Learn more
        </button>
      </div>
    </div>

    <div v-else class="bg-red-950/20 border border-red-900/50 rounded-2xl p-5 max-w-2xl text-red-400 text-sm mt-4">
      <span class="font-bold uppercase tracking-wider block mb-1">Prihlasovanie zatvorené</span>
      Momentálne nie je otvorená žiadna aktívna výzva pre Program A. Sledujte administráciu pre nasledujúce jarné/jesenné kolá.
    </div>
  </PageHero>

  <section class="justify-left mb-24">
    <div class="text-xs font-mono uppercase tracking-widest text-blue-500 mb-2">Application process</div>
    <h2 class="text-3xl font-medium mb-10 text-white">How does it work?</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <div class="group border border-slate-800 rounded-2xl p-6 bg-slate-900/40 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/60">
        <div class="text-5xl font-bold text-blue-500 transition-transform duration-300 group-hover:text-blue-400 group-hover:translate-x-1">1.</div> 
        <h3 class="text-lg font-bold text-white mt-4 mb-2">Register Team</h3>
        <div class="text-slate-400 text-sm leading-relaxed">
          Form a team of at least {{ activeCall?.min_team_size || 3 }} members inside your profile.
        </div>
      </div>

      <div class="group border border-slate-800 rounded-2xl p-6 bg-slate-900/40 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/60">
        <div class="text-5xl font-bold text-blue-500 transition-transform duration-300 group-hover:text-blue-400 group-hover:translate-x-1">2.</div>
        <h3 class="text-lg font-bold text-white mt-4 mb-2">Submit Proposal</h3>
        <div class="text-slate-400 text-sm leading-relaxed">
          Upload all dynamic attachments specified by the administration configuration form schema.
        </div>
      </div>

      <div class="group border border-slate-800 rounded-2xl p-6 bg-slate-900/40 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/60">
        <div class="text-5xl font-bold text-blue-500 transition-transform duration-300 group-hover:text-blue-400 group-hover:translate-x-1">3.</div> 
        <h3 class="text-lg font-bold text-white mt-4 mb-2">Evaluation</h3>
        <div class="text-slate-400 text-sm leading-relaxed">
          Your uploaded package will undergo formal validation and technical verification by the expert commission.
        </div>
      </div>

      <div class="group border border-slate-800 rounded-2xl p-6 bg-slate-900/40 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/60">
        <div class="text-5xl font-bold text-blue-500 transition-transform duration-300 group-hover:text-blue-400 group-hover:translate-x-1">4.</div> 
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
      <div 
        v-for="(docName, index) in parsedDocuments" 
        :key="index" 
        class="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex items-start gap-4 transition hover:border-slate-700"
      >
        <div class="text-2xl font-mono font-bold text-blue-500/80 bg-blue-950/40 border border-blue-900/30 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
          {{ index + 1 }}
        </div>
        
        <div class="pt-1.5">
          <h3 class="text-base font-bold text-white leading-snug">{{ parseDocName(docName) }}</h3>
        </div>
      </div>
    </div>
  </section>
</template>