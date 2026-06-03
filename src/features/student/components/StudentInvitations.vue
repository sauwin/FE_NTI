<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMyInvitations, respondToInvitation } from '../api/teams'
import type { Invitation } from '../types/teams'
import { useConfirm } from "@/shared/composables/useConfirm.ts"

const { t } = useI18n()
const loading = ref(false)
const invitations = ref<Invitation[]>([])
const error = ref('')

async function fetchInvitations() {
  loading.value = true
  error.value = ''
  try {
    const res = await getMyInvitations()
    invitations.value = res.data
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? t('student.invitations.errLoad')
  } finally {
    loading.value = false
  }
}

async function respond(teamId: number, status: 'accepted' | 'rejected') {
  try {
    await respondToInvitation(teamId, status)
    invitations.value = invitations.value.filter(inv => inv.id !== teamId)
  } catch (e: any) {
    await useConfirm({
      title: t('student.common.fail'),
      message: e?.response?.data?.message ?? t('student.common.actionFailed'),
      confirmText: t('student.common.okay'),
      cancelText: t('student.common.cancel'),
      danger: false,
    })
    await fetchInvitations()
  }
}

onMounted(() => { fetchInvitations() })
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h3 class="text-xl font-bold text-white">{{ t('student.invitations.title') }}</h3>
        <p class="text-sm text-slate-500 mt-1">{{ t('student.invitations.description') }}</p>
      </div>
    </div>

    <div v-if="error" class="p-3 rounded-lg text-sm mb-6 border bg-red-900/20 border-red-800 text-red-400 font-mono">
      {{ t('student.common.systemError', { error }) }}
    </div>

    <div v-if="loading" class="text-slate-500 animate-pulse py-12 text-center font-mono text-sm">
      {{ t('student.common.loading') }}
    </div>
    
    <div v-else>
      <div v-if="invitations.length === 0" class="border border-slate-800 border-dashed rounded-2xl p-12 text-center bg-slate-900/10">
        <p class="text-slate-400 text-base font-medium">{{ t('student.invitations.noInvitations') }}</p>
        <p class="text-slate-600 text-xs mt-1.5">{{ t('student.invitations.noInvitationsDesc') }}</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="invite in invitations" 
          :key="invite.id" 
          class="border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          :class="invite.status === 'ready'
            ? 'border-red-900/40 bg-red-950/10 opacity-75' 
            : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/20'
          "
        >
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <div class="text-white font-bold text-base tracking-tight">{{ invite.name }}</div>
              
              <span 
                v-if="invite.status === 'ready'" 
                class="text-xs px-2 py-0.5 rounded border font-mono uppercase bg-red-900/40 text-red-400 border-red-800"
              >
                {{ t('student.invitations.lockedContainer') }}
              </span>
            </div>
            
            <div class="text-sm text-slate-400 flex flex-col sm:flex-row sm:items-stretch gap-1 sm:gap-3">
              <div class="flex items-center gap-1.5">
                <span class="text-slate-500 font-mono text-xs uppercase">{{ t('student.invitations.teamLeader') }}</span>
                <span class="text-slate-200 font-semibold">{{ invite.leader?.name }}</span>
              </div>
              <div class="hidden sm:flex items-center text-slate-700">|</div>
              <div class="text-slate-500 font-mono text-xs flex items-center">
                {{ invite.leader?.email }}
              </div>
            </div>
            
            <p v-if="invite.status === 'ready'" class="text-xs font-mono text-red-400/90 bg-red-900/10 border border-red-900/30 px-3 py-2 rounded-lg max-w-xl mt-2">
              {{ t('student.invitations.lockedConfigDesc') }}
            </p>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-auto whitespace-nowrap">
            <button 
              @click="respond(invite.id, 'accepted')"
              :disabled="invite.status === 'ready'"
              class="text-xs px-3 py-1.5 rounded border bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border-emerald-800 transition disabled:opacity-20 disabled:cursor-not-allowed font-mono uppercase cursor-pointer font-semibold"
            >
              {{ t('student.invitations.accept') }}
            </button>
            
            <button 
              @click="respond(invite.id, 'rejected')"
              class="text-xs px-3 py-1.5 rounded border bg-slate-800 hover:bg-slate-700 text-white border-slate-700 transition font-mono uppercase cursor-pointer"
            >
              {{ invite.status === 'ready' ? t('student.invitations.dismiss') : t('student.invitations.decline') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>