<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

defineProps<{
  applications: any[]
  loading: boolean
}>()

const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="space-y-3 animate-pulse">
      <div v-for="i in 3" :key="i" class="h-24 bg-slate-900/50 border border-slate-800 rounded-xl"></div>
    </div>

    <div v-else-if="applications.length === 0" class="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
      {{ t('evaluation.completedTable.noEvaluations') }}
    </div>

    <div v-else class="grid grid-cols-1 gap-3">
      <div 
        v-for="app in applications" 
        :key="app.id" 
        class="border border-slate-800 bg-slate-900/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs uppercase font-mono tracking-wider bg-green-950/40 border border-green-900/40 text-green-400 px-2 py-0.5 rounded-md">
              {{ t('evaluation.program', { program: app.program?.toUpperCase() }) }}
            </span>
            <span class="text-slate-500 text-xs font-mono">ID: #{{ app.id }}</span>
          </div>
          <h3 class="text-base font-bold text-slate-300 mb-1">{{ app.project_name || t('evaluation.untitled') }}</h3>
          <p class="text-xs text-slate-500">Tím: <span class="text-slate-400">{{ app.team_name || t('evaluation.unspecified') }}</span></p>
        </div>
        <button 
          @click="router.push(`/evaluations/application/${app.id}`)"
          class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2 rounded-lg transition text-center whitespace-nowrap"
        >
          {{ t('evaluation.completedTable.editEvaluation') }}
        </button>
      </div>
    </div>
  </div>
</template>