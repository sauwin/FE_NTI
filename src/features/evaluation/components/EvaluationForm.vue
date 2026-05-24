<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApplicationById } from '@/features/applications/api/applications'
import { createEvaluation, updateEvaluation, getEvaluations } from '@/features/evaluation/api/evaluations'

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
  { key: 'innovation', label: 'Innovation', weight: 25 },
  { key: 'feasibility', label: 'Feasibility', weight: 25 },
  { key: 'team', label: 'Team Competency', weight: 25 },
  { key: 'impact', label: 'Impact & Market', weight: 25 },
]

const scores = ref(
    CRITERIA.map(c => ({ criterion_key: c.key, score: 0, weight_at_moment: c.weight, comment: '' }))
)
const recommendation = ref<'approve' | 'reject' | 'request_revision'>('approve')
const comment = ref('')

onMounted(async () => {
  try {
    const [appRes, evalRes] = await Promise.all([
      getApplicationById(applicationId),
      getEvaluations({ application_id: applicationId }),
    ])
    app.value = appRes.data
    const evals = evalRes.data?.data ?? evalRes.data
    if (evals?.length) {
      existingEvaluation.value = evals[0]
      recommendation.value = evals[0].recommendation
      comment.value = evals[0].comment ?? ''
      if (evals[0].scores?.length) {
        scores.value = evals[0].scores.map((s: any) => ({
          criterion_key: s.criterion_key,
          score: s.score,
          weight_at_moment: s.weight_at_moment,
          comment: s.comment ?? '',
        }))
      }
    }
  } catch {
    error.value = 'Could not load application'
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
    success.value = 'Evaluation saved.'
    setTimeout(() => router.push('/dashboard'), 1500)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Could not save evaluation'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex-center-page">
    <div class="w-full max-w-2xl">
      <button @click="router.push('/dashboard')" class="text-gray-500 hover:text-white text-sm mb-6">← Back</button>

      <div class="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-600/10 border border-blue-900 px-4 py-1.5 rounded-full mb-2">
        Evaluation
      </div>
      <h1 class="text-3xl font-bold text-white mb-6">
        Application #{{ applicationId }}
      </h1>

      <div v-if="loading" class="text-slate-500 animate-pulse">Loading...</div>

      <div v-else>
        <p v-if="error" class="text-red-400 text-sm mb-4">{{ error }}</p>
        <p v-if="success" class="text-green-400 text-sm mb-4">{{ success }}</p>

        <div v-if="app" class="border border-slate-800 rounded-xl p-4 bg-slate-900/30 mb-6 text-sm">
          <div class="text-gray-500">Program <span class="text-white">{{ app.program_type?.toUpperCase() }}</span></div>
          <div class="text-gray-500 mt-1">Status <span class="text-white capitalize">{{ app.status }}</span></div>
        </div>

        <div class="border border-slate-800 rounded-xl p-6 bg-slate-900/30 mb-4">
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">Criteria Scores</div>
          <div class="flex flex-col gap-5">
            <div v-for="(row, i) in scores" :key="row.criterion_key">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-white">{{ CRITERIA[i].label }}</span>
                <span class="text-xs text-slate-500">Weight: {{ row.weight_at_moment }}%</span>
              </div>
              <input
                  type="range" min="0" max="100" v-model.number="row.score"
                  class="w-full accent-blue-500"
              />
              <div class="flex justify-between text-xs text-slate-500 mt-1">
                <span>0</span><span class="text-blue-400 font-bold">{{ row.score }}</span><span>100</span>
              </div>
              <input
                  v-model="row.comment"
                  type="text"
                  placeholder="Comment (optional)"
                  class="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 outline-none"
              />
            </div>
          </div>
        </div>

        <div class="border border-slate-800 rounded-xl p-6 bg-slate-900/30 mb-4">
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-4">Recommendation</div>
          <div class="flex gap-3 flex-wrap">
            <button
                v-for="opt in ['approve','reject','request_revision']" :key="opt"
                @click="recommendation = opt as any"
                :class="[
'px-4 py-2 rounded-lg text-sm border capitalize transition',
recommendation === opt
? opt === 'approve' ? 'bg-green-900/40 border-green-700 text-green-400'
: opt === 'reject' ? 'bg-red-900/40 border-red-700 text-red-400'
: 'bg-yellow-900/40 border-yellow-700 text-yellow-400'
: 'border-slate-700 text-slate-400 hover:border-slate-600'
]">
              {{ opt.replace('_', ' ') }}
            </button>
          </div>
        </div>

        <div class="border border-slate-800 rounded-xl p-6 bg-slate-900/30 mb-6">
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-3">Overall Comment</div>
          <textarea
              v-model="comment"
              rows="4"
              placeholder="Overall evaluation note..."
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 outline-none resize-none"
          />
        </div>

        <button
            @click="submit"
            :disabled="submitting"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
          {{ submitting ? 'Saving...' : existingEvaluation ? 'Update Evaluation' : 'Submit Evaluation' }}
        </button>
      </div>
    </div>
  </div>
</template>