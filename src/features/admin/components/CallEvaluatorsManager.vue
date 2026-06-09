<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAdminCalls, getAdminUsers } from '@/features/admin/api/admin'
import { getCallEvaluators, assignEvaluator, removeEvaluator } from '@/features/evaluation/api/evaluations'
import { scheduleCallEvaluation, getCallEvaluationInfo, moveApplicationsUnderEvaluation } from '@/features/admin/api/admin'
import EvaluationCriteriaManager from './EvaluationCriteriaManager.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const calls = ref<any[]>([])
const selectedCallId = ref<number | null>(null)
const selectedCall = ref<any>(null)
const evaluators = ref<any[]>([])
const allUsers = ref<any[]>([])
const selectedUserId = ref<number | null>(null)
const loading = ref(false)
const error = ref('')
const success = ref('')
const evaluationScheduledAt = ref<string>('')
const schedulingLoading = ref(false)
const movingLoading = ref(false)
const schedulingError = ref('')
const schedulingSuccess = ref('')
const evaluationStats = ref<any>({
  formally_verified: 0,
  under_evaluation: 0,
  total: 0,
})

const applicationsToMove = computed(() => {
  return evaluationStats.value.formally_verified ?? 0
})

onMounted(async () => {
  try {
    const [callsRes, usersRes] = await Promise.all([
      getAdminCalls(),
      getAdminUsers(),
    ])
    calls.value = Array.isArray(callsRes.data) ? callsRes.data : (callsRes.data as { data?: unknown[] })?.data ?? []
    allUsers.value = (usersRes.data.data ?? []).filter((u: any) =>
        u.role_in_org == 'evaluator' ||
        u.roles?.some((r: any) => r.slug === 'evaluator')
    )
  } catch (e) {
    error.value = t('admin.callEvaluatorsManager.errors.loadDataFailed')
    console.error('Error loading data:', e)
  }
})

async function loadEvaluators() {
  if (!selectedCallId.value) return
  loading.value = true
  error.value = ''
  try {
    const [evaluatorsRes, statsRes] = await Promise.all([
      getCallEvaluators(selectedCallId.value),
      getCallEvaluationInfo(selectedCallId.value),
    ])
    evaluators.value = evaluatorsRes.data ?? []
    
    selectedCall.value = calls.value.find(c => c.id === selectedCallId.value) || null
    
    if (statsRes.data?.applications) {
      evaluationStats.value = statsRes.data.applications
    }
    
    if (selectedCall.value?.evaluation_scheduled_at) {
      const dateStr = selectedCall.value.evaluation_scheduled_at
      evaluationScheduledAt.value = dateStr.slice(0, 16)
    } else {
      evaluationScheduledAt.value = ''
    }
  } catch (e) {
    error.value = t('admin.callEvaluatorsManager.errors.loadEvaluatorsFailed')
    console.error('Error loading evaluators:', e)
  } finally {
    loading.value = false
  }
}

async function assign() {
  if (!selectedCallId.value || !selectedUserId.value) return
  error.value = ''
  try {
    await assignEvaluator(selectedCallId.value, selectedUserId.value)
    success.value = t('admin.callEvaluatorsManager.success.assigned')
    selectedUserId.value = null
    await loadEvaluators()
    setTimeout(() => (success.value = ''), 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? t('admin.callEvaluatorsManager.errors.assignFailed')
    console.error('Error assigning evaluator:', e)
  }
}

async function remove(userId: number) {
  if (!selectedCallId.value) return
  error.value = ''
  try {
    await removeEvaluator(selectedCallId.value, userId)
    evaluators.value = evaluators.value.filter(e => e.id !== userId)
    success.value = t('admin.callEvaluatorsManager.success.removed')
    setTimeout(() => (success.value = ''), 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? t('admin.callEvaluatorsManager.errors.removeFailed')
    console.error('Error removing evaluator:', e)
  }
}

async function handleScheduleEvaluation() {
  if (!selectedCallId.value || !evaluationScheduledAt.value) {
    schedulingError.value = t('admin.callEvaluatorsManager.errors.validationChooseAndDate')
    return
  }
  
  schedulingError.value = ''
  schedulingSuccess.value = ''
  schedulingLoading.value = true
  
  try {
    const res = await scheduleCallEvaluation(selectedCallId.value, {
      evaluation_scheduled_at: evaluationScheduledAt.value,
    })
    
    schedulingSuccess.value = t('admin.callEvaluatorsManager.success.scheduled')
    
    if (selectedCall.value) {
      selectedCall.value.evaluation_scheduled_at = res.data.data.evaluation_scheduled_at
    }
    
    setTimeout(() => (schedulingSuccess.value = ''), 4000)
  } catch (e: any) {
    console.error('Error scheduling evaluation:', e)
    schedulingError.value = e.response?.data?.message ?? t('admin.callEvaluatorsManager.errors.scheduleFailed')
  } finally {
    schedulingLoading.value = false
  }
}

async function changeAppsStatus() {
  if (!selectedCallId.value) {
    schedulingError.value = t('admin.callEvaluatorsManager.errors.validationChooseCall')
    return
  }

  if (!evaluationScheduledAt.value) {
    schedulingError.value = t('admin.callEvaluatorsManager.errors.validationScheduleFirst')
    return
  }
  
  schedulingError.value = ''
  schedulingSuccess.value = ''
  movingLoading.value = true
  
  try {
    const res = await moveApplicationsUnderEvaluation(selectedCallId.value)
    
    console.log(res)
    schedulingSuccess.value = t('admin.callEvaluatorsManager.success.moved', { count: res.data.applications_moved })
    
    evaluationStats.value.formally_verified = 0
    evaluationStats.value.under_evaluation += res.data.applications_moved
    
    setTimeout(() => (schedulingSuccess.value = ''), 4000)
  } catch (e: any) {
    console.error('Error while moving applications:', e)
    schedulingError.value = e.response?.data?.message ?? t('admin.callEvaluatorsManager.errors.moveFailed')
  } finally {
    movingLoading.value = false
  }
}

function getMinDateTime(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().substring(0, 10)
}
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6 space-y-6">
    <h3 class="text-xl font-bold text-white">{{ $t('admin.callEvaluatorsManager.title') }}</h3>

    <!-- ERROR/SUCCESS MESSAGES -->
    <div v-if="error" class="p-3 bg-red-950/30 border border-red-900/40 rounded-lg text-red-400 text-sm">
      {{ error }}
    </div>
    <div v-if="success" class="p-3 bg-green-950/30 border border-green-900/40 rounded-lg text-green-400 text-sm">
      {{ success }}
    </div>

    <!-- CALL SELECTION -->
    <div>
      <label class="block text-sm font-medium text-slate-300 mb-2">{{ $t('admin.callEvaluatorsManager.selectCallLabel') }}</label>
      <select
          v-model.number="selectedCallId"
          @change="loadEvaluators"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none">
        <option :value="null">{{ $t('admin.callEvaluatorsManager.chooseCallPlaceholder') }}</option>
        <option v-for="call in calls" :key="call.id" :value="call.id">
          {{ call.name }} ({{ call.program?.name }})
        </option>
      </select>
    </div>

    <!-- EVALUATION SCHEDULING SECTION -->
    <div v-if="selectedCall" class="pt-6 border-t border-slate-800 space-y-4">
      <h4 class="text-lg font-semibold text-white flex items-center gap-2">
        {{ $t('admin.callEvaluatorsManager.scheduling.title') }}
      </h4>

      <div v-if="schedulingError" class="p-3 bg-red-950/30 border border-red-900/40 rounded-lg text-red-400 text-sm">
        {{ schedulingError }}
      </div>
      <div v-if="schedulingSuccess" class="p-3 bg-green-950/30 border border-green-900/40 rounded-lg text-green-400 text-sm">
        {{ schedulingSuccess }}
      </div>

      <!-- DATE INPUT + BUTTON -->
      <div class="flex gap-3 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            {{ $t('admin.callEvaluatorsManager.scheduling.dateLabel') }}
            <span class="text-slate-500 text-xs">{{ $t('admin.callEvaluatorsManager.scheduling.dateSublabel') }}</span>
          </label>
          <input
            v-model="evaluationScheduledAt"
            type="datetime-local"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none"
            :min="getMinDateTime() + 'T09:00'"
          />
        </div>

        <button
          @click="handleScheduleEvaluation"
          :disabled="!evaluationScheduledAt || schedulingLoading"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
        >
          <span v-if="schedulingLoading">{{ $t('admin.callEvaluatorsManager.scheduling.btnScheduling') }}</span>
          <span v-else>{{ $t('admin.callEvaluatorsManager.scheduling.btnSetDate') }}</span>
        </button>
      </div>

      <!-- INFO BOX: HOW MANY APPLICATIONS WILL BE MOVED -->
      <div class="relative p-4 bg-blue-950/20 border border-blue-900/30 rounded-lg space-y-2">
        <p class="text-sm text-blue-300 font-medium">{{ $t('admin.callEvaluatorsManager.stats.title') }}</p>

        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="bg-slate-950/50 rounded p-2">
            <div class="text-slate-400">{{ $t('admin.callEvaluatorsManager.stats.formallyVerified') }}</div>
            <div class="text-white font-semibold text-lg">
              {{ evaluationStats.formally_verified }}
            </div>
          </div>

          <div class="bg-slate-950/50 rounded p-2">
            <div class="text-slate-400">{{ $t('admin.callEvaluatorsManager.stats.underEvaluation') }}</div>
            <div class="text-white font-semibold text-lg">
              {{ evaluationStats.under_evaluation }}
            </div>
          </div>

          <div class="bg-slate-950/50 rounded p-2">
            <div class="text-slate-400">{{ $t('admin.callEvaluatorsManager.stats.total') }}</div>
            <div class="text-white font-semibold text-lg">
              {{ evaluationStats.total }}
            </div>
          </div>
        </div>

        <p v-if="applicationsToMove > 0" class="text-sm text-blue-300 mt-2 pr-28">
          <strong>
            {{ applicationsToMove }} 
            {{ applicationsToMove === 1 ? 'application' : 'applications' }}
          </strong>
          {{ $t('admin.callEvaluatorsManager.stats.willBeMoved') }}
          <code class="text-xs bg-slate-950 px-1.5 py-0.5 rounded">formally_verified</code>
          →
          <code class="text-xs bg-slate-950 px-1.5 py-0.5 rounded">under_evaluation</code>
          on this date
        </p>

        <p v-else class="text-sm text-slate-400 mt-2">
          {{ $t('admin.callEvaluatorsManager.stats.noAppsToMove') }}
        </p>

        <button 
          v-if="applicationsToMove > 0" 
          type="button" 
          :disabled="movingLoading"
          @click="changeAppsStatus" class="absolute bottom-4 right-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
          {{ movingLoading ? $t('admin.callEvaluatorsManager.stats.btnMoving') : $t('admin.callEvaluatorsManager.stats.btnMoveNow') }}
        </button>
      </div>
    </div>

    <!-- EVALUATION CRITERIA SECTION -->
    <EvaluationCriteriaManager v-if="selectedCall" :selected-call="selectedCall" />

    <!-- EVALUATORS SECTION -->
    <div v-if="selectedCall" class="pt-6 border-t border-slate-800 space-y-4">
      <h4 class="text-lg font-semibold text-white">{{ $t('admin.callEvaluatorsManager.assignSection.title') }}</h4>

      <!-- ASSIGN FORM -->
      <div class="flex gap-3">
        <select
            v-model.number="selectedUserId"
            class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none">
          <option :value="null">{{ $t('admin.callEvaluatorsManager.assignSection.placeholder') }}</option>
          <option 
            v-for="user in allUsers.filter(u => !evaluators.some(e => e.id === u.id))" 
            :key="user.id" 
            :value="user.id">
            {{ user.name }} ({{ user.email }})
          </option>
        </select>
        <button
          @click="assign"
          :disabled="!selectedUserId || loading"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition">
          {{ loading ? $t('admin.callEvaluatorsManager.assignSection.btnAssigning') : $t('admin.callEvaluatorsManager.assignSection.btnAssign') }}
        </button>
      </div>

      <!-- EVALUATORS LIST -->
      <div class="space-y-2">
        <p class="text-sm text-slate-400">
          {{ 
            evaluators.length === 0 
              ? $t('admin.callEvaluatorsManager.assignSection.assignedCountZero') 
              : evaluators.length === 1 
                ? $t('admin.callEvaluatorsManager.assignSection.assignedCountOne') 
                : $t('admin.callEvaluatorsManager.assignSection.assignedCountPlural', { count: evaluators.length }) 
          }}
        </p>
        <div v-if="evaluators.length === 0" class="text-xs text-slate-500 italic py-2">
          {{ $t('admin.callEvaluatorsManager.assignSection.noEvaluators') }}
        </div>
        <div
          v-for="evaluator in evaluators"
          :key="evaluator.id"
          class="flex justify-between items-center p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
          <div>
            <p class="text-sm font-medium text-white">{{ evaluator.name }}</p>
            <p class="text-xs text-slate-400">{{ evaluator.email }}</p>
          </div>
          <button
            @click="remove(evaluator.id)"
            class="px-3 py-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition">
            {{ $t('admin.callEvaluatorsManager.assignSection.btnRemove') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>