<script setup lang="ts">
import { ref } from 'vue'
import { inviteMember, removeMember } from '../api/teams'

interface TeamMember {
  id: number
  name: string
  email: string
  pivot?: {
    status: 'pending' | 'accepted' | 'rejected'
    joined_at?: string | null
  }
}

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
    success.value = `Invitation sent to ${email.value}`
    email.value = ''
    emits('refresh')
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to send invitation.'
  } finally {
    submitting.value = false
  }
}

async function handleRemoveMember(userId: number) {
  if (!props.isLeader) return
  if (!confirm('Are you sure you want to remove this member?')) return

  try {
    await removeMember(props.team.id, userId)
    emits('refresh')
  } catch (e: any) {
    alert(e?.response?.data?.error ?? 'Failed to remove member.')
  }
}
</script>

<template>
  <div class="mt-4 pt-4 border-t border-slate-800 space-y-4">
    <div>
      <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Members</div>
      <div class="space-y-2">
        <div 
          v-for="member in (team.members ?? [])" 
          :key="member.id" 
          class="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-900"
        >
          <div class="flex items-center gap-2">
            <div 
              class="w-2 h-2 rounded-full" 
              :class="member.pivot?.status === 'accepted' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'"
            ></div>
            <div>
              <div class="text-sm text-slate-200 font-medium">{{ member.name }}</div>
              <div class="text-xs text-slate-500">{{ member.email }}</div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span v-if="team.leader_id === member.id" class="text-[10px] bg-blue-950 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded">
              Leader
            </span>
            <span v-else-if="member.pivot?.status === 'pending'" class="text-[10px] bg-amber-950 text-amber-500 border border-amber-900/40 px-2 py-0.5 rounded">
              Pending
            </span>

            <button 
              v-if="isLeader && team.leader_id !== member.id"
              @click="handleRemoveMember(member.id)"
              class="text-slate-500 hover:text-red-400 text-xs transition p-1"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <form v-if="isLeader" @submit.prevent="sendInvite" class="space-y-2">
      <label class="text-xs text-slate-400 block">Invite new member by Email</label>
      <div class="flex gap-2">
        <input 
          v-model="email" 
          type="email" 
          placeholder="student@example.com" 
          class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none flex-1 placeholder:text-slate-600"
        />
        <button 
          type="submit" 
          :disabled="submitting"
          class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          {{ submitting ? 'Sending…' : 'Invite' }}
        </button>
      </div>
      <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
      <p v-if="success" class="text-xs text-emerald-400">{{ success }}</p>
    </form>
    <div v-else class="text-xs text-slate-500 italic">
      🔒 Only the team leader can invite or manage members.
    </div>
  </div>
</template>