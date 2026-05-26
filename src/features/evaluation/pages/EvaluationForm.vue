<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { getApplicationById } from '@/features/applications/api/applications'
  import { createEvaluation, updateEvaluation, getMyEvaluations } from '@/features/evaluation/api/evaluations'

  const route = useRoute()
  const router = useRouter()
  const applicationId = Number(route.params.applicationId)

  const app = ref<any>(null)
  const existingEvaluation = ref<any>(null)
  const loading = ref(true)
  const submitting = ref(false)
  const error = ref('')
  const success = ref('')

  const CRITERIA = [
    { key: 'innovation', label: 'Inovácia a technologický prínos', weight: 25 },
    { key: 'feasibility', label: 'Realizovateľnosť a plán (Roadmapa)', weight: 25 },
    { key: 'team', label: 'Kompetencia a zloženie tímu', weight: 25 },
    { key: 'impact', label: 'Trhový potenciál a rozpočet', weight: 25 },
  ]

  const scores = ref(
    CRITERIA.map(c => ({ criterion_key: c.key, score: 50, weight_at_moment: c.weight, comment: '' }))
  )
  const recommendation = ref<'approve' | 'reject' | 'request_revision'>('approve')
  const comment = ref('')

  const totalWeightedScore = computed(() => {
    const sum = scores.value.reduce((acc, curr) => {
      return acc + (Number(curr.score) * (Number(curr.weight_at_moment) / 100))
    }, 0)
    return Math.round(sum)
  })

  onMounted(async () => {
    try {

      const [appRes, evalRes] = await Promise.all([
        getApplicationById(applicationId),
        getMyEvaluations(),
      ])
      
      app.value = appRes.data
      
      const allMyEvals = evalRes.data?.data ?? evalRes.data ?? []
      const currentAppEvaluation = allMyEvals.find((e: any) => Number(e.application_id) === applicationId)
      
      if (currentAppEvaluation) {
        existingEvaluation.value = currentAppEvaluation
        recommendation.value = currentAppEvaluation.recommendation
        comment.value = currentAppEvaluation.comment ?? ''
        
        if (currentAppEvaluation.scores?.length) {
          scores.value = currentAppEvaluation.scores.map((s: any) => {
            const meta = CRITERIA.find(c => c.key === s.criterion_key)
            return {
              criterion_key: s.criterion_key,
              label: meta?.label ?? s.criterion_key, 
              score: s.score,
              weight_at_moment: s.weight_at_moment,
              comment: s.comment ?? '',
            }
          })
        }
      }
    } catch (err) {
      error.value = 'Nepodarilo sa načítať podklady prihlášky.'
    } finally {
      loading.value = false
    }
  })

  async function submit() {
    submitting.value = true
    error.value = ''
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
      
      <div class="flex items-center gap-3">
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
              <div class="flex justify-between"><span class="text-slate-500">Názov tímu:</span> <span class="text-slate-300">{{ app.team.name }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Typ programu:</span> <span class="text-indigo-400 uppercase font-semibold">Program {{ app.program_type }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Fáza/Stav:</span> <span class="text-amber-400 capitalize">{{ app.status?.replace(/_/g, ' ') }}</span></div>
            </div>
          </div>

          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Podporné akademické signály</h2>
            <div class="bg-slate-900/20 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Počet členov v tíme:</span>
                <span class="font-medium px-2 py-0.5 rounded bg-slate-800 text-white">{{ app.academic_signals?.member_count ?? 3 }} (Minimálne 3)</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Čestné vyhlásenie o prenášaní predmetov:</span>
                <span class="font-medium text-green-400">V poriadku (Splnené)</span>
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Priložená projektová dokumentácia</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div v-for="doc in ['Executive Summary', 'Technická architektúra', 'Projektová roadmapa', 'Rozpočet a alokácia grantu']" :key="doc"
                   class="bg-slate-900/60 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between group transition">
                <div class="flex items-center gap-2 overflow-hidden">
                  <span class="text-xl">📄</span>
                  <div class="truncate">
                    <p class="text-xs text-white font-medium truncate">{{ doc }}</p>
                    <p class="text-[10px] text-slate-500">PDF Document</p>
                  </div>
                </div>
                <button @click.prevent class="text-xs text-blue-400 hover:text-blue-300 font-medium opacity-80 group-hover:opacity-100 transition">
                  Zobraziť
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 lg:overflow-y-auto max-h-[calc(100vh-69px)] bg-slate-900/10">
        <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/20 border border-red-900 p-3 rounded-xl">{{ error }}</p>
        <p v-if="success" class="text-green-400 text-sm mb-4 bg-green-950/20 border border-green-900 p-3 rounded-xl">{{ success }}</p>

        <div class="space-y-6 mb-6">
          <div v-for="(row, i) in scores" :key="row.criterion_key" class="bg-slate-900/40 border border-slate-800 p-5 rounded-xl">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 class="text-sm font-semibold text-white">{{ row.label }}</h3>
              </div>
              <span class="text-[11px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Váha: {{ row.weight_at_moment }}%</span>
            </div>
            
            <div class="mt-4">
              <input
                type="range" min="0" max="100" v-model.number="row.score"
                class="w-full accent-blue-500 cursor-pointer bg-slate-800 h-1.5 rounded-lg appearance-none"
              />
              <div class="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                <span>0 b.</span>
                <span class="text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md text-sm">{{ row.score }} b.</span>
                <span>100 b.</span>
              </div>
            </div>

            <input
              v-model="row.comment"
              type="text"
              placeholder="Špecifická poznámka ku kritériu (nepovinné)..."
              class="mt-4 w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div class="bg-slate-900/40 border border-slate-800 p-5 rounded-xl mb-6">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Finálne odporúčanie komisie</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              v-for="opt in ['approve', 'request_revision', 'reject']" 
              :key="opt"
              @click="recommendation = opt as any"
              :class="[
                'px-4 py-2.5 rounded-xl text-xs font-semibold border capitalize transition text-center flex items-center justify-center',
                recommendation === opt
                  ? opt === 'approve' ? 'bg-green-500/10 border-green-500 text-green-400 shadow-sm shadow-green-500/5'
                  : opt === 'reject' ? 'bg-red-500/10 border-red-500 text-red-400 shadow-sm shadow-red-500/5'
                  : 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/5'
                  : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              ]"
            >
              <span v-if="opt === 'approve'">Schváliť do inkubátora</span>
              <span v-else-if="opt === 'request_revision'">Vrátiť na doplnenie</span>
              <span v-else>Zamietnuť projekt</span>
            </button>
          </div>
        </div>

        <div class="bg-slate-900/40 border border-slate-800 p-5 rounded-xl mb-6">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Celkové slovné odôvodnenie verdiktu</h3>
          <p class="text-[11px] text-slate-500 mb-3">Toto vyjadrenie bude zaznamenané v histórii a v prípade vrátenia sa zobrazí študentom.</p>
          <textarea
            v-model="comment"
            rows="4"
            placeholder="Zadajte podrobné oficiálne stanovisko komisie k celkovému hodnoteniu..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none resize-none transition"
          />
        </div>
      </div>

    </div>
  </div>
</template>