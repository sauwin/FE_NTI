<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyInvitations, respondToInvitation } from '../api/teams'

interface Invitation {
  id: number
  name: string
  status: 'forming' | 'ready'
  leader?: {
    name: string
    email: string
  }
}

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
  <div class="mt-6">
    <div class="mb-4">
      <h3 class="text-white font-semibold text-lg">Team Invitations</h3>
      <p class="text-xs text-slate-500">Here you can accept or decline requests to join other teams.</p>
    </div>

    <div v-if="loading" class="text-slate-500 text-sm">Loading invitations…</div>
    
    <div v-else>
      <div v-if="error" class="text-sm text-red-400 mb-3">{{ error }}</div>

      <div v-if="invitations.length === 0" class="border border-slate-800 rounded-2xl p-8 text-center bg-slate-900/20">
        <p class="text-slate-500 text-sm">No pending invitations.</p>
        <p class="text-slate-600 text-xs mt-1">When someone invites you to a team via email, it will appear here.</p>
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="invite in invitations" 
          :key="invite.id" 
          class="border border-slate-800 bg-slate-900/40 p-4 rounded-xl flex items-center justify-between"
          :class="{ 'opacity-75 border-dashed': invite.status === 'ready' }"
        >
          <div>
            <div class="flex items-center gap-2">
              <div class="text-white font-semibold text-sm">{{ invite.name }}</div>
              
              <span 
                v-if="invite.status === 'ready'" 
                class="text-[10px] bg-red-950/40 text-red-400 border border-red-900/30 px-1.5 py-0.5 rounded"
              >
                🔒 Closed (Ready)
              </span>
            </div>
            <div class="text-slate-400 text-xs mt-1">Leader: {{ invite.leader?.name }} ({{ invite.leader?.email }})</div>
            
            <p v-if="invite.status === 'ready'" class="text-[11px] text-amber-500/80 mt-1">
              ⚠️ You cannot join this team because it is already locked for applications.
            </p>
          </div>

          <div class="flex gap-2">
            <button 
              @click="respond(invite.id, 'accepted')"
              :disabled="invite.status === 'ready'"
              class="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-md font-medium transition"
            >
              Accept
            </button>
            
            <button 
              @click="respond(invite.id, 'rejected')"
              class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-md font-medium transition border border-slate-700"
            >
              {{ invite.status === 'ready' ? 'Dismiss' : 'Decline' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>