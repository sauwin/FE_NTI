<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { inviteMember, removeMember } from '../api/teams'
import type { TeamMember } from '../types/teams'
import { useConfirm } from "@/shared/composables/useConfirm.ts"

const { t } = useI18n()
const props = defineProps<{
  team: {
    id: number
    leader_id: number
    members?: TeamMember[] 
    [key: string]: any   
  }
  isLeader: boolean
}>()

const emits = defineEmits(['refresh'])

const email = ref('')
const submitting = ref(false)
const error = ref('')
const success = ref('')

async function sendInvite() {
  if (!props.isLeader) return
  error.value = ''
  success.value = ''
  if (!email.value.trim()) return

  submitting.value = true
  try {
    await inviteMember(props.team.id, email.value)
    success.value = t('student.members.successInvite', { email: email.value })
    email.value = ''
    emits('refresh')
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? t('student.members.errInvite')
  } finally {
    submitting.value = false
  }
}

async function handleRemoveMember(userId: number) {
  if (!props.isLeader) return
  const confirmed = await useConfirm({
    title: t('student.members.confirmRemoveTitle'),
    message: t('student.members.confirmRemoveMsg'),
    confirmText: t('student.members.confirmRemoveBtn'),
    cancelText: t('student.common.cancel'),
    danger: false,
  })
  if (!confirmed) return

  try {
    await removeMember(props.team.id, userId)
    emits('refresh')
  } catch (e: any) {
    await useConfirm({
      title: t('student.common.errorTitle'),
      message: e?.response?.data?.error ?? t('student.members.errRemove'),
      confirmText: t('student.common.okay'),
      danger: false,
    })
  }
}
</script>

<template>
  <div class="pt-6 border-t border-slate-800 space-y-6">
    <div class="space-y-4">
      <div class="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
        {{ t('student.members.title') }}
      </div>
      
      <div class="space-y-3">
        <div 
          v-for="member in (team.members ?? [])" 
          :key="member.id" 
          class="flex items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800 hover:border-slate-500 transition-all"
        >
          <div class="flex items-center gap-4">
            <div 
              class="w-2 h-2 rounded-full border" 
              :class="member.pivot?.status === 'accepted' ? 'bg-white border-slate-400' : 'bg-slate-700 border-slate-600'"
            ></div>
            <div>
              <div class="text-base font-bold text-white">{{ member.name }}</div>
              <div class="text-sm text-slate-300 font-mono mt-0.5">{{ member.email }}</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span 
              v-if="team.leader_id === member.id" 
              class="text-xs text-white border border-slate-500 px-2.5 py-0.5 rounded font-mono uppercase tracking-wider font-semibold bg-slate-950"
            >
              {{ t('student.members.leader') }}
            </span>
            
            <span 
              v-else-if="member.pivot?.status === 'pending'" 
              class="text-xs text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded font-mono uppercase tracking-wider bg-slate-950/60"
            >
              {{ t('student.members.pending') }}
            </span>

            <button 
              v-if="isLeader && team.leader_id !== member.id"
              @click="handleRemoveMember(member.id)"
              class="text-xs font-mono border border-slate-600 hover:border-red-400 text-slate-200 hover:text-red-400 px-3 py-1 rounded-lg transition cursor-pointer bg-slate-950"
            >
              {{ t('student.members.remove') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-slate-900/20 p-5 border border-slate-800 rounded-xl">
      <form v-if="isLeader" @submit.prevent="sendInvite" class="space-y-3">
        <label class="text-xs uppercase font-mono font-bold tracking-wider text-slate-300 block">
          {{ t('student.members.inviteLabel') }}
        </label>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <input 
            v-model="email" 
            type="email" 
            placeholder="student@example.com" 
            class="bg-slate-950 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:border-white outline-none transition-all placeholder:text-slate-500 flex-1 font-mono"
          />
          <button 
            type="submit" 
            :disabled="submitting"
            class="text-sm bg-slate-800 hover:bg-slate-700 px-5 py-2 rounded-lg border border-slate-500 text-white font-medium transition-all font-mono cursor-pointer disabled:opacity-40"
          >
            {{ submitting ? t('student.members.processing') : t('student.members.btnSend') }}
          </button>
        </div>
        
        <p v-if="error" class="text-sm font-mono text-red-400 mt-2 font-semibold">{{ t('student.common.errorTitle') }}: {{ error }}</p>
        <p v-if="success" class="text-sm font-mono text-emerald-400 mt-2 font-semibold">Success: {{ success }}</p>
      </form>

      <div v-else class="text-sm font-mono text-slate-300 border border-slate-800 bg-slate-950/60 p-4 rounded-xl leading-relaxed">
        {{ t('student.members.restricted') }}
      </div>
    </div>
  </div>
</template>