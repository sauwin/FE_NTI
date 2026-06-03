<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { Mentorship } from '../types/mentorships'

  const { t, locale } = useI18n()

  defineProps<{
    mentorships: Mentorship[]
    loading: boolean
    error: string
    isRequestMode?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'view-project', mentorship: Mentorship): void
    (e: 'accept-request', mentorship: Mentorship): void
    (e: 'reject-request', mentorship: Mentorship): void
  }>()
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading && mentorships.length === 0" class="space-y-4">
      <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50 animate-pulse">
        <div class="h-5 bg-slate-800 rounded mb-4 w-1/4"></div>
        <div class="space-y-3">
          <div v-for="n in 3" :key="n" class="h-10 bg-slate-950/60 rounded-xl border border-slate-800/40 w-full"></div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
      {{ error }}
    </div>
    
    <div v-else-if="mentorships.length === 0" class="bg-slate-900/40 border border-slate-800 rounded-2xl text-center py-12 text-slate-500 text-sm">
      {{ isRequestMode ? t('mentor.table.noRequests') : t('mentor.table.noProjects') }}
    </div>

    <div v-else class="overflow-x-auto bg-slate-900/40 rounded-2xl border border-slate-800">
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-mono text-xs uppercase tracking-wider">
            <th class="p-4 px-5 font-semibold">{{ t('mentor.table.thTeam') }}</th>
            <th class="p-4 px-5 font-semibold">{{ t('mentor.table.thProgram') }}</th>
            <th class="p-4 px-5 font-semibold">{{ t('mentor.table.thDate') }}</th>
            <th class="p-4 px-5 font-semibold">{{ t('mentor.table.thStatus') }}</th>
            <th class="p-4 px-5 font-semibold text-right">{{ t('mentor.table.thActions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 text-slate-300">
          <tr v-for="m in mentorships" :key="m.id" class="hover:bg-slate-800/20 transition group">
            <td class="p-4 px-5 font-medium text-white">
              {{ m.application?.team?.name || t('mentor.table.individual') }}
            </td>
            <td class="p-4 px-5 text-slate-400 font-mono text-xs uppercase tracking-wider">
              {{ m.application?.program_type ? t('mentor.table.programLabel', { type: m.application.program_type.toUpperCase() }) : t('mentor.table.na') }}
            </td>
            <td class="p-4 px-5 text-slate-400 font-mono text-xs">
              {{ m.assigned_at ? new Date(m.assigned_at).toLocaleDateString(locale === 'sk' ? 'sk-SK' : 'en-US') : '—' }}
            </td>
            <td class="p-4 px-5">
              <span 
                class="px-2.5 py-1 text-xs rounded-xl border font-mono uppercase font-semibold tracking-wide text-[10px]"
                :class="m.application?.status === 'onboarding' 
                  ? 'bg-amber-950/40 text-amber-400 border-amber-900/40' 
                  : 'bg-blue-600/15 text-blue-400 border-blue-900/40'"
              >
                {{ m.application?.status || 'active' }}
              </span>
            </td>
            <td class="p-4 px-5 text-right">
              <div class="flex justify-end gap-2">
                <template v-if="isRequestMode">
                  <button 
                    @click="emit('view-project', m)"
                    class="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                  >
                    {{ t('mentor.table.btnReview') }}
                  </button>
                  <button 
                    @click="emit('accept-request', m)"
                    class="text-xs bg-green-950/20 hover:bg-green-900/30 text-green-400 border border-green-900/40 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    {{ t('mentor.table.btnAccept') }}
                  </button>
                  <button 
                    @click="emit('reject-request', m)"
                    class="text-xs bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/40 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    {{ t('mentor.table.btnReject') }}
                  </button>
                </template>

                <template v-else>
                  <button 
                    @click="emit('view-project', m)"
                    class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium transition shadow-sm shadow-blue-900/20"
                  >
                    {{ t('mentor.table.btnShow') }}
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>