<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyInvitations, respondToInvitation } from '../api/teams'
import type { Invitation } from '../types/teams'

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
    error.value = e?.response?.data?.message ?? 'Failed to load invitations.'
  } finally {
    loading.value = false
  }
}

async function respond(teamId: number, status: 'accepted' | 'rejected') {
  try {
    await respondToInvitation(teamId, status)
    invitations.value = invitations.value.filter(inv => inv.id !== teamId)
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Action failed.')
    await fetchInvitations()
  }
}

onMounted(() => { fetchInvitations() })
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-xl font-bold text-white">Team Invitations</h3>
      <p class="text-sm text-slate-500 mt-1">Here you can accept or decline requests to join other incubator teams.</p>
    </div>

    <div v-if="loading" class="text-slate-500 animate-pulse py-4 font-mono text-sm">
      Loading invitations containers...
    </div>
    
    <div v-else>
      <div v-if="error" class="text-xs font-mono text-red-400 bg-red-950/20 border border-red-900/40 p-4 rounded-xl mb-4">
        System Error: {{ error }}
      </div>

      <div v-if="invitations.length === 0" class="border border-slate-800 border-dashed rounded-2xl p-12 text-center bg-slate-900/10">
        <p class="text-slate-400 text-base font-medium">No pending invitations.</p>
        <p class="text-slate-600 text-xs mt-1.5 font-mono">When someone invites you to a team container via email, it will appear here.</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="invite in invitations" 
          :key="invite.id" 
          class="border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          :class="invite.status === 'ready'
            ? 'border-rose-900/50 bg-rose-950/10 opacity-80' 
            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/60'
          "
        >
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <div class="text-white font-bold text-base tracking-tight">{{ invite.name }}</div>
              
              <span 
                v-if="invite.status === 'ready'" 
                class="text-[10px] bg-rose-900/40 text-rose-400 border border-rose-800 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-semibold"
              >
                Locked Container
              </span>
            </div>
            
            <div class="text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span class="text-slate-500 font-mono">Team Leader:</span>
              <span class="text-slate-200 font-medium">{{ invite.leader?.name }}</span>
              <span class="text-slate-500 font-mono hidden sm:inline">|</span>
              <span class="text-slate-400 font-mono text-[11px]">{{ invite.leader?.email }}</span>
            </div>
            
            <p v-if="invite.status === 'ready'" class="text-[11px] font-mono text-rose-400/90 bg-rose-950/40 border border-rose-900/30 px-3 py-1.5 rounded-lg max-w-xl">
              Configuration Locked: You cannot append your user scope to this team because it has already locked its state layout for final application evaluation.
            </p>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-auto">
            <button 
              @click="respond(invite.id, 'accepted')"
              :disabled="invite.status === 'ready'"
              class="text-xs bg-emerald-900/40 hover:bg-emerald-900/60 px-3.5 py-2 rounded-xl text-emerald-400 border border-emerald-800/80 transition-all font-mono font-semibold cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
            >
              Accept
            </button>
            
            <button 
              @click="respond(invite.id, 'rejected')"
              class="text-xs bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 transition-all font-mono font-medium cursor-pointer"
            >
              {{ invite.status === 'ready' ? 'Dismiss' : 'Decline' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>