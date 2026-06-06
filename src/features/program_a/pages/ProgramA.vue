<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getActiveCalls } from '@/shared/api/calls'
import type { ActiveCall, DocumentRequirement } from '@/shared/types/calls'

import PageHero from '@/shared/ui/PageHero.vue'

const { t } = useI18n()
const router = useRouter()
const activeCall = ref<ActiveCall | null>(null)
const parsedDocuments = ref<DocumentRequirement[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await getActiveCalls('a')
    console.log('API Response:', res.data)
    
    if (res.data) {
      const callData = Array.isArray(res.data) ? res.data[0] : res.data
      
      if (callData && callData.status === 'open') {
        activeCall.value = callData
        const docs = callData.required_documents || []
        parsedDocuments.value = Array.isArray(docs)
          ? docs.map((doc: any) => {
              if (typeof doc === 'string') {
                return {
                  document_name: doc.replace(/_/g, ' ').toUpperCase(),
                  is_mandatory: true,
                  max_size_mb: 10,
                  type: doc,
                }
              }
              return doc
            })
          : []
      } else {
        activeCall.value = null
        parsedDocuments.value = []
      }
    }
  } catch (error) {
    console.error('Error fetching active call:', error)
    activeCall.value = null
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
</script>

<template>
  <div class="hidden md:block bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>

  <PageHero
    :badge="t('programA.view.badge')"
    :title="t('programA.view.title')"
    :highlight="t('programA.view.highlight')"
    :description="t('programA.view.description')"
  >
    <div v-if="loading" class="text-slate-500 text-sm font-mono mt-4">
      {{ t('programA.view.checkingStatus') }}
    </div>
    
    <div v-else-if="activeCall && activeCall.status === 'open'" class="space-y-4 mt-4">
      <div class="text-sm text-green-400 flex items-center gap-2 font-mono">
        <span class="w-2 py-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        {{ t('programA.view.callIsOpen', { name: activeCall.name }) }}
        <span class="font-bold text-white">{{ formatDate(activeCall.deadline_at) }}</span>
      </div>
      <div class="flex gap-4">
        <button @click="router.push('/programs/a/upload')" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition shadow-lg shadow-blue-900/30">
          {{ t('programA.view.submitApplication') }}
        </button>
        <button class="border border-slate-700 hover:border-slate-500 text-slate-300 px-8 py-3 rounded-lg font-medium transition">
          {{ t('programA.view.learnMore') }}
        </button>
      </div>
    </div>

    <div v-else class="bg-red-950/20 border border-red-900/50 rounded-2xl p-5 max-w-2xl text-red-400 text-sm mt-4">
      <span class="font-bold uppercase tracking-wider block mb-1">
        {{ t('programA.view.registrationClosed') }}
      </span>
      {{ t('programA.view.noActiveCall') }}
    </div>
  </PageHero>

  <section class="justify-left mb-24">
    <div class="text-xs font-mono uppercase tracking-widest text-blue-500 mb-2">
      {{ t('programA.view.processTitle') }}
    </div>
    <h2 class="text-3xl font-medium mb-10 text-white">
      {{ t('programA.view.howItWorks') }}
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <div class="group border border-slate-800 rounded-2xl p-6 bg-slate-900/40 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/60">
        <div class="text-5xl font-bold text-blue-500 transition-transform duration-300 group-hover:text-blue-400 group-hover:translate-x-1">1.</div> 
        <h3 class="text-lg font-bold text-white mt-4 mb-2">
          {{ t('programA.view.steps.registerTeam.title') }}
        </h3>
        <div class="text-slate-400 text-sm leading-relaxed">
          {{ t('programA.view.steps.registerTeam.description', { size: activeCall?.min_team_size || 3 }) }}
        </div>
      </div>

      <div class="group border border-slate-800 rounded-2xl p-6 bg-slate-900/40 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/60">
        <div class="text-5xl font-bold text-blue-500 transition-transform duration-300 group-hover:text-blue-400 group-hover:translate-x-1">2.</div>
        <h3 class="text-lg font-bold text-white mt-4 mb-2">
          {{ t('programA.view.steps.submitProposal.title') }}
        </h3>
        <div class="text-slate-400 text-sm leading-relaxed">
          {{ t('programA.view.steps.submitProposal.description') }}
        </div>
      </div>

      <div class="group border border-slate-800 rounded-2xl p-6 bg-slate-900/40 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/60">
        <div class="text-5xl font-bold text-blue-500 transition-transform duration-300 group-hover:text-blue-400 group-hover:translate-x-1">3.</div> 
        <h3 class="text-lg font-bold text-white mt-4 mb-2">
          {{ t('programA.view.steps.evaluation.title') }}
        </h3>
        <div class="text-slate-400 text-sm leading-relaxed">
          {{ t('programA.view.steps.evaluation.description') }}
        </div>
      </div>

      <div class="group border border-slate-800 rounded-2xl p-6 bg-slate-900/40 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/60">
        <div class="text-5xl font-bold text-blue-500 transition-transform duration-300 group-hover:text-blue-400 group-hover:translate-x-1">4.</div> 
        <h3 class="text-lg font-bold text-white mt-4 mb-2">
          {{ t('programA.view.steps.incubation.title') }}
        </h3>
        <div class="text-slate-400 text-sm leading-relaxed">
          {{ t('programA.view.steps.incubation.description') }}
        </div>
      </div>

    </div>
  </section>

  <section v-if="parsedDocuments.length" class="border-slate-900">
    <div class="text-xs font-mono uppercase tracking-widest text-blue-500 mb-2">
      {{ t('programA.view.attachmentsTitle') }}
    </div>
    <h2 class="text-3xl font-semibold text-white mb-8">
      {{ t('programA.view.requiredDocs') }}
    </h2>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div 
        v-for="(doc, index) in parsedDocuments" 
        :key="index" 
        class="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex items-start gap-4 transition hover:border-slate-700"
      >
        <div class="text-2xl font-mono font-bold text-blue-500/80 bg-blue-950/40 border border-blue-900/30 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
          {{ index + 1 }}
        </div>
        
        <div class="pt-1.5 flex-1">
          <h3 class="text-base font-bold text-white leading-snug">{{ doc.document_name }}</h3>
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            <span v-if="doc.is_mandatory" class="text-xs bg-red-950/50 text-red-300 border border-red-900/50 rounded px-2 py-1 font-mono uppercase">
              {{ t('programA.view.mandatory') }}
            </span>
            <span class="text-xs text-slate-400 font-mono">{{ t('programA.view.maxSize', { size: doc.max_size_mb }) }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>