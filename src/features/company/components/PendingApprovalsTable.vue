<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const props = defineProps<{
  pendingUsers: any[]
  loading?: boolean
}>()

const emit = defineEmits(['approve', 'reject'])

const hasPending = computed(() => props.pendingUsers && props.pendingUsers.length > 0)
</script>

<template>
  <div>
    <div v-if="loading && (!pendingUsers || pendingUsers.length === 0)" class="space-y-4">
      <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50 animate-pulse">
        <div class="h-5 bg-slate-800 rounded mb-4 w-1/4"></div>
        <div class="space-y-3">
          <div v-for="n in 3" :key="n" class="h-10 bg-slate-950/60 rounded-xl border border-slate-800/40 w-full"></div>
        </div>
      </div>
    </div>

    <div v-else-if="!hasPending" class="bg-slate-900/40 border border-slate-800 rounded-2xl text-center py-10 text-slate-500 text-sm">
      {{ t('company.approvals.noPending') }}
    </div>

    <div v-else class="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/40">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-800 bg-slate-900/50">
          <tr class="text-left text-slate-400 font-mono text-xs uppercase tracking-wider">
            <th class="py-3.5 px-5">{{ t('company.common.name') }}</th>
            <th class="py-3.5 px-5">{{ t('company.common.email') }}</th>
            <th class="py-3.5 px-5">{{ t('company.approvals.requestedRole') }}</th>
            <th class="py-3.5 px-5">{{ t('company.common.created') }}</th>
            <th class="py-3.5 px-5 text-right">{{ t('company.common.actions') }}</th>
          </tr>
        </thead>

        <tbody class="text-slate-300 divide-y divide-slate-800/60">
          <tr
            v-for="user in pendingUsers"
            :key="`${user.id}-${user.role_slug}`"
            class="hover:bg-slate-800/20 transition group"
          >
            <td class="py-4 px-5 font-medium text-white">
              {{ user.first_name }} {{ user.last_name }}
            </td>
            <td class="py-4 px-5 text-slate-400 font-mono text-xs">
              {{ user.email }}
            </td>
            <td class="py-4 px-5">
              <span class="text-xs bg-amber-950/40 border border-amber-900/40 text-amber-400 px-2.5 py-1 rounded-xl font-medium uppercase font-mono tracking-wide">
                {{ user.role_slug.replace('_', ' ') }}
              </span>
            </td>
            <td class="py-4 px-5 text-xs text-slate-400 font-mono">
              {{ new Date(user.created_at).toLocaleDateString(locale === 'sk' ? 'sk-SK' : 'en-US') }}
            </td>
            <td class="py-4 px-5 text-right">
              <div class="flex gap-2 justify-end">
                <button
                  @click="$emit('approve', user)"
                  class="text-xs bg-green-950/20 hover:bg-green-900/30 text-green-400 border border-green-900/40 px-3 py-1.5 rounded-lg transition font-medium"
                >
                  {{ t('company.approvals.approve') }}
                </button>
                <button
                  @click="$emit('reject', user)"
                  class="text-xs bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/40 px-3 py-1.5 rounded-lg transition font-medium"
                >
                  {{ t('company.approvals.reject') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>