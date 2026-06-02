<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { getCallEvaluationCriteria } from '@/shared/api/calls';
  
  import DocumentActionButtons from '@/shared/components/DocumentActionButtons.vue'

  import { 
    getApplicationById, 
    getApplicationDocuments 
  } from '@/features/applications/api/applications'
  import { 
    createEvaluation, 
    updateEvaluation, 
    getMyEvaluations 
  } from '@/features/evaluation/api/evaluations'

  const route = useRoute()
  const router = useRouter()
  const applicationId = Number(route.params.applicationId)

  const app = ref<any>(null)
  const docs = ref<any[]>([]) 
  const existingEvaluation = ref<any>(null)
  const loading = ref(true)
  const submitting = ref(false)
  const error = ref('')
  const success = ref('')

  const criteria = ref([
    {
      id: 1,
      call_id: 1,
      slug: 'overall_score',
      title: 'Overall score',
      weight: 100,
    }
  ])

  const criteriaToEmptyScores = () => {
    return criteria.value.map(c => ({ criterion_id: c.id, score: 50, title: c.title, weight_at_moment: c.weight, comment: '' }))
  }

  const scores = ref(
    criteriaToEmptyScores()
  )
  const recommendation = ref<'approve' | 'reject' | 'request_revision'>('approve')
  const comment = ref('')

  const totalWeightedScore = computed(() => {
    const sum = scores.value.reduce((acc, curr) => {
      return acc + (Number(curr.score) * (Number(curr.weight_at_moment) / 100))
    }, 0)
    return Math.round(sum)
  })

  const fetchCallCriteria = async (callId: number) => {
    const res = await getCallEvaluationCriteria(callId)
    if (res.data) {
      criteria.value = res.data
      scores.value = criteriaToEmptyScores()
      console.log(criteria.value)
    } else {
      criteria.value = []
    }
  }

  onMounted(async () => {
    try {
      const [appRes, docsRes, evalRes] = await Promise.all([
        getApplicationById(applicationId),
        getApplicationDocuments(applicationId),
        getMyEvaluations(),
      ])
      
      app.value = appRes.data
      docs.value = docsRes.data ?? []
      
      const allMyEvals = evalRes.data?.data ?? evalRes.data ?? []
      const currentAppEvaluation = allMyEvals.find((e: any) => Number(e.application_id) === applicationId)
      
      if(app.value.call.id) {
        await fetchCallCriteria(app.value.call.id)
      }

      if (currentAppEvaluation) {
        existingEvaluation.value = currentAppEvaluation
        recommendation.value = currentAppEvaluation.recommendation
        comment.value = currentAppEvaluation.comment ?? ''
        
        if (currentAppEvaluation.scores?.length) {
          scores.value = currentAppEvaluation.scores.map((s: any) => {
            const meta = criteria.value.find(c => c.id === s.criterion_id)
            return {
              criterion_id: s.criterion_id,
              title: meta?.title ?? 'No title', 
              score: s.score,
              weight_at_moment: s.weight_at_moment,
              comment: s.comment ?? '',
            }
          })
        }
      }
    } catch (err) {
      error.value = 'Vyskytla sa chyba pri načítaní údajov.'
    } finally {
      loading.value = false
    }
  })

  async function submit() {
    submitting.value = true
    error.value = ''
    success.value = ''
    
    try {
      const payload = {
        application_id: applicationId,
        scores: scores.value,
        recommendation: recommendation.value,
        comment: comment.value,
      }
      
      if (existingEvaluation.value) {
        await updateEvaluation(existingEvaluation.value.id, payload)
      } else {
        await createEvaluation(payload)
      }
      
      success.value = 'Hodnotenie bolo úspešne zaznamenané do auditnej stopy NTI.'
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'Chyba pri ukladaní hodnotenia.'
    } finally {
      submitting.value = false
    }
  }
</script>

<template>
  <div class="bg-slate-950 min-h-screen text-slate-100 flex flex-col">
    <div class="border-b border-slate-800 bg-slate-900/60 px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      <div class="flex items-center gap-4">
        <button @click="router.push('/dashboard')" class="text-slate-400 hover:text-white transition text-sm flex items-center gap-1.5">
          ← Späť na prehľad
        </button>
        <span class="text-slate-700">|</span>
        <h1 class="text-lg font-bold text-white flex items-center gap-2">
          Posudzovanie prihlášky <span class="font-mono text-blue-400">#{{ applicationId }}</span>
        </h1>
      </div>
      
      <div class="flex items-center gap-6">
        <div v-if="app && app.total_evaluators_count" class="text-right hidden md:block border-r border-slate-800 pr-6">
          <span class="text-xs text-slate-400 block">Stav hodnotiacej komisie</span>
          <span class="text-sm font-mono font-semibold text-slate-300">
            Odovzdané: <span class="text-blue-400 font-bold">{{ app.completed_evaluations_count }}</span> / {{ app.total_evaluators_count }}
          </span>
          <span v-if="app.pending_evaluators_count > 0" class="text-[10px] text-amber-400/80 block mt-0.5">
            Čaká sa na ešte {{ app.pending_evaluators_count }} posudok(y)
          </span>
          <span v-else class="text-[10px] text-green-400 block mt-0.5">
            Všetci členovia komisie uzavreli hodnotenie
          </span>
        </div>

        <div class="text-right hidden sm:block">
          <span class="text-xs text-slate-400 block">Vážený priemer</span>
          <span class="text-lg font-mono font-bold text-blue-400">{{ totalWeightedScore }} / 100 b</span>
        </div>
        
        <button
          @click="submit"
          :disabled="submitting"
          class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition shadow-sm"
        >
          {{ submitting ? 'Ukladám...' : existingEvaluation ? 'Aktualizovať hodnotenie' : 'Odoslať verdikt' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center text-slate-400 animate-pulse">
      Načítavam posudkový hárok a študentskú dokumentáciu...
    </div>

    <div v-else class="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      <div class="p-6 border-b lg:border-b-0 lg:border-r border-slate-800 lg:overflow-y-auto max-h-[calc(100vh-69px)]">
        <div class="space-y-6">
          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Základné informácie o projekte</h2>
            <div v-if="app" class="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3 text-sm">
              <div class="flex justify-between"><span class="text-slate-500">Názov tímu:</span> <span class="text-slate-300">{{ app.team?.name ?? 'Neznámy tím' }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Typ programu:</span> <span class="text-indigo-400 uppercase font-semibold">Program {{ app.program_type }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Fáza/Stav:</span> <span class="text-amber-400 capitalize">{{ app.status?.replace(/_/g, ' ') }}</span></div>
            </div>
          </div>

          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Podporné akademické signály</h2>
            <div class="bg-slate-900/20 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Počet členov v tíme:</span>
                <span class="font-medium px-2 py-0.5 rounded bg-slate-800 text-white">{{ app?.academic_signals?.member_count ?? 3 }} (Minimálne 3)</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Čestné vyhlásenie o prenášaní predmetov:</span>
                <span class="font-medium text-green-400">V poriadku (Splnené)</span>
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Priložená projektová dokumentácia</h2>
            <div v-if="docs.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {{ console.log(docs) }}
              <div v-for="doc in docs" :key="doc.id"
                   class="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between group transition">
                <div class="flex items-center gap-2 overflow-hidden">
                  <span class="text-xl">📄</span>
                  <div class="truncate">
                    <p class="text-xs text-white font-medium truncate" :title="doc.name || doc.file_path">
                      {{ doc.type ?? doc.file_name ?? 'Unnamed document' }}
                    </p>
                    <p class="text-[10px] text-slate-500 uppercase">
                      {{ doc.file_path?.split('.').pop() ?? 'SÚBOR' }}
                    </p>
                  </div>
                </div>
                <DocumentActionButtons :documentId="doc.id" :fileName="doc.file_name" :mimeType="doc.mime_type"/>
              </div>
            </div>
            <div v-else class="text-xs text-slate-500 bg-slate-900/20 border border-slate-800/50 rounded-xl p-6 text-center">
              K tejto prihláške neboli priložené žiadne dokumenty.
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 lg:overflow-y-auto max-h-[calc(100vh-69px)] bg-slate-900/10">
        <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/20 border border-red-900 p-3 rounded-xl">{{ error }}</p>
        <p v-if="success" class="text-green-400 text-sm mb-4 bg-green-950/20 border border-green-900 p-3 rounded-xl">{{ success }}</p>

        <div class="space-y-6 mb-6">
          <div v-for="row in scores" :key="row.criterion_id" class="bg-slate-900/40 border border-slate-800 p-5 rounded-xl">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div><h3 class="text-sm font-semibold text-white">{{ row.title }}</h3></div>
              <span class="text-[11px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Váha: {{ row.weight_at_moment }}%</span>
            </div>
            <div class="mt-4">
              <input type="range" min="0" max="100" v-model.number="row.score" class="w-full accent-blue-500 cursor-pointer bg-slate-800 h-1.5 rounded-lg appearance-none"/>
              <div class="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                <span>0 b.</span>
                <span class="text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md text-sm">{{ row.score }} b.</span>
                <span>100 b.</span>
              </div>
            </div>
            <input v-model="row.comment" type="text" placeholder="Špecifická poznámka ku kritériu (nepovinné)..." class="mt-4 w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none transition"/>
          </div>
        </div>

        <div class="bg-slate-900/40 border border-slate-800 p-5 rounded-xl mb-6">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Finálne odporúčanie komisie</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button v-for="opt in ['approve', 'request_revision', 'reject']" :key="opt" @click="recommendation = opt as any" :class="['px-4 py-2.5 rounded-xl text-xs font-semibold border capitalize transition text-center flex items-center justify-center', recommendation === opt ? opt === 'approve' ? 'bg-green-500/10 border-green-500 text-green-400 shadow-sm shadow-green-500/5' : opt === 'reject' ? 'bg-red-500/10 border-red-500 text-red-400 shadow-sm shadow-red-500/5' : 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/5' : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700 hover:text-slate-200']">
              <span v-if="opt === 'approve'">Schváliť do inkubátora</span>
              <span v-else-if="opt === 'request_revision'">Vrátiť na doplnenie</span>
              <span v-else>Zamietnuť projekt</span>
            </button>
          </div>
        </div>

        <div class="bg-slate-900/40 border border-slate-800 p-5 rounded-xl mb-6">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Celkové slovné odôvodnenie verdiktu</h3>
          <p class="text-[11px] text-slate-500 mb-3">Toto vyjadrenie bude zaznamenané v histórii a v prípade vrátenia sa zobrazí študentom.</p>
          <textarea v-model="comment" rows="4" placeholder="Zadajte podrobné oficiálne stanovisko komisie k celkovému hodnoteniu..." class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none resize-none transition"/>
        </div>
      </div>
    </div>
  </div>
</template>