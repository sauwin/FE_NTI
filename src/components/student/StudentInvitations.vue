<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api/axios'

interface TeamInvitation {
  id: number
  team_id: number
  team_name: string
  leader_name: string
  invited_at: string
  status: string
}

const invitations = ref<TeamInvitation[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const fetchInvitations = async () => {
  loading.value = true
  error.value = null
  try {
    // Fetch pending team invitations via notifications or team API
    const response = await api.get('/notifications')
    // Filter for team invitation notifications
    invitations.value = response.data.filter((notification: any) => 
      notification.type === 'team_invitation' && !notification.read_at
    ).map((notification: any) => ({
      id: notification.id,
      team_id: notification.data?.team_id,
      team_name: notification.data?.team_name,
      leader_name: notification.data?.leader_name,
      invited_at: notification.created_at,
      status: 'pending'
    }))
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load invitations'
  } finally {
    loading.value = false
  }
}

const acceptInvitation = async (invitationId: number) => {
  try {
    // Mark notification as read and accept the invitation
    await api.patch(`/notifications/${invitationId}/read`)
    invitations.value = invitations.value.filter(inv => inv.id !== invitationId)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to accept invitation'
  }
}

const rejectInvitation = async (invitationId: number) => {
  try {
    await api.patch(`/notifications/${invitationId}/read`)
    invitations.value = invitations.value.filter(inv => inv.id !== invitationId)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to reject invitation'
  }
}

onMounted(() => {
  fetchInvitations()
})
</script>

<template>
  <div class="space-y-6">
    <div class="section-label">Team Invitations</div>

    <div v-if="loading" class="text-slate-400">
      Loading invitations...
    </div>

    <div v-else-if="error" class="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
      {{ error }}
    </div>

    <div v-else-if="invitations.length === 0" class="bg-slate-900/50 rounded-lg p-6 text-center">
      <p class="text-slate-400">No pending team invitations</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="invitation in invitations" :key="invitation.id"
           class="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h4 class="font-semibold text-white">{{ invitation.team_name }}</h4>
          <p class="text-sm text-slate-400">Invited by {{ invitation.leader_name }}</p>
          <p class="text-xs text-slate-500 mt-1">{{ new Date(invitation.invited_at).toLocaleDateString() }}</p>
        </div>
        <div class="flex gap-2">
          <button @click="acceptInvitation(invitation.id)"
                  class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            Accept
          </button>
          <button @click="rejectInvitation(invitation.id)"
                  class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            Reject
          </button>
        </div>
      </div>
    </div>
  </div>
</template>