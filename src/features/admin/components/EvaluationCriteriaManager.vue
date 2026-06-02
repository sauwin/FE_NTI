<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { changeCallEvaluationCriteria } from '../api/admin';
  import { getCallEvaluationCriteria } from '@/shared/api/calls';
  import type { Call, EvaluationCriterion, EvaluationCriterionPayload } from '../types/admin';

  const props = defineProps<{
    selectedCall: Call
  }>()

  const criteria = ref<EvaluationCriterion[] | null>(null)
  const message = ref<string | null>(null)
  const error = ref(false)
  const loading = ref(false)

  const addCriterion = () => {
    if (!criteria.value) {
      criteria.value = []
    }

    criteria.value.push({
      call_id: props.selectedCall.id,
      slug: '',
      title: '',
      weight: 0,
      comment: '',
    })
  }

  const clearMessage = (seconds: number) => {
    setTimeout(() => {
      message.value = null
    }, seconds * 1000)
  }

  const displayError = (msg: string) => {
    error.value = true
    message.value = msg
  }

  const displaySuccess = (msg: string) => {
    error.value = false
    message.value = msg
  }

  const syncCriteria = async () => {
    try {
      loading.value = true

      if (!criteria.value?.length) {
        displayError('Nothing to sync')
        clearMessage(8)
        return
      }

      const payload: EvaluationCriterionPayload = {
        criteria:
          criteria.value.map(c => ({
          id: c?.id,
          slug: c.slug,
          title: c.title,
          comment: c?.comment,
          weight: c.weight,
        }))
      }

      const res = await changeCallEvaluationCriteria(props.selectedCall.id, payload)
      displaySuccess('Criteria saved successfully')
      criteria.value = res.data
    }
    catch(e: any) {
      if (e?.response?.data?.message) {
        displayError(e.response.data.message)
      }
      else if (e?.message) {
        displayError(e.message)
      } 
      else {
        displayError('Error while saving criteria')
      }
    }
    finally {
      loading.value = false
      clearMessage(8)
    }
  }

  onMounted(async () => {
    try {
      const res = await getCallEvaluationCriteria(props.selectedCall.id)
      criteria.value = res.data
    } catch {
      criteria.value = []
      displayError('Error while fetching evaluation criteria')
    }
  })

  const emit = defineEmits(['refresh'])
</script>

<template>
  <div class="pt-6 border-t border-slate-800 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="text-lg font-semibold text-white">Evaluation Criteria</h4>
        <p class="text-xs text-slate-400 mt-0.5">Define structured parameters and weights for proposal scoring.</p>
      </div>
      <button
        type="button"
        @click="addCriterion"
        class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-white rounded-lg text-xs font-mono transition"
      >
        + Add Criterion
      </button>
    </div>

    <div 
      v-if="criteria && criteria.length > 0"
      class="p-3 rounded-lg border text-xs flex items-center justify-between font-mono"
      :class="
        criteria && criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) === 100
          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
          : 'bg-amber-950/20 border-amber-900/40 text-amber-400'
      "
    >
      <span>Total Allocated Weight:</span>
      <span class="font-bold text-sm">
        {{ criteria && criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) }}% / 100%
      </span>
    </div>

    <div v-if="!criteria || criteria.length === 0" class="text-xs text-slate-500 italic py-2">
      No evaluation criteria defined for this call yet. Click "Add Criterion" to start.
    </div>

    <div v-else class="space-y-3">
      <div 
        v-for="(criterion, index) in criteria" 
        :key="index"
        class="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3 relative group"
      >
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div class="md:col-span-3">
            <label class="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Slug (Max 35 char)</label>
            <input
              v-model="criterion.slug"
              type="text"
              placeholder="e.g. tech_feasibility"
              maxlength="35"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-600 outline-none font-mono"
            />
          </div>

          <div class="md:col-span-6">
            <label class="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Criterion Title</label>
            <input
              v-model="criterion.title"
              type="text"
              placeholder="e.g. Technical Feasibility & Innovation"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-600 outline-none"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Weight (%)</label>
            <input
              v-model.number="criterion.weight"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-600 outline-none font-mono"
            />
          </div>

          <div class="md:col-span-1 flex items-end justify-end">
            <button
              type="button"
              @click="criteria.splice(index, 1)"
              class="p-1.5 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-950 hover:bg-red-950/20 rounded-md transition mb-0.5"
              title="Remove criterion"
            >
              ✕
            </button>
          </div>
        </div>

        <div>
          <label class="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Description / Guidelines (Optional)</label>
          <textarea
            v-model="criterion.comment"
            rows="1"
            placeholder="Describe what evaluators should look for when scoring this specific criterion..."
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-600 outline-none resize-none"
          />
        </div>
      </div>
    </div>

    <div 
      v-if="message"
      class="p-3 rounded-lg border text-xs flex items-center font-mono"
      :class="error
          ? 'bg-red-950/20 border-red-900/40 text-red-400'
          : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
      "
    >
      {{message}}
    </div>

    <div v-if="criteria && criteria.length > 0" class="flex justify-end pt-2">
      <button
        type="button"
        :disabled="loading || criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) !== 100"
        @click="syncCriteria"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 border border-blue-500/20 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
      >
        {{ loading ? 'Saving...' : 'Save Configuration' }}
      </button>
    </div>
  </div>
</template>