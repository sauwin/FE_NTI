<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTeams, deleteTeam, updateTeam } from '../api/teams'
import type { Team } from '../types/teams'
import TeamForm from './TeamForm.vue'
import TeamMembersManager from './TeamMembersManager.vue'

const props = defineProps<{
  currentUserId?: number
}>()

const loading = ref(false)
const teams = ref<Team[]>([])
const error = ref('')
const showTeamForm = ref(false)
const expandedTeamId = ref<number | null>(null)

const editingTeamId = ref<number | null>(null)
const editName = ref('')
const editDescription = ref('')
const saving = ref(false)

async function fetchTeams() {
  loading.value = true
  error.value = ''
  try {
    const res = await getTeams()
    teams.value = res.data
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Failed to load teams.'
  } finally {
    loading.value = false
  }
}

function onTeamCreated(newTeam: any) {
  showTeamForm.value = false
  fetchTeams()
}

function toggleExpand(teamId: number) {
  if (editingTeamId.value === teamId) return
  expandedTeamId.value = expandedTeamId.value === teamId ? null : teamId
}

function startEdit(team: Team) {
  if (team.status !== 'forming') return
  editingTeamId.value = team.id
  editName.value = team.name
  editDescription.value = team.description ?? ''
}

function cancelEdit() {
  editingTeamId.value = null
}

async function handleUpdateTeam(teamId: number) {
  if (!editName.value.trim()) return
  saving.value = true
  try {
    await updateTeam(teamId, {
      name: editName.value,
      description: editDescription.value
    })
    editingTeamId.value = null
    await fetchTeams()
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Failed to update team.')
  } finally {
    saving.value = false
  }
}

async function handleDeleteTeam(teamId: number) {
  if (!confirm('Are you sure you want to permanently delete this team? This action cannot be undone.')) {
    return
  }
  try {
    await deleteTeam(teamId)
    if (expandedTeamId.value === teamId) expandedTeamId.value = null
    await fetchTeams()
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Failed to delete team.')
  }
}

function getAcceptedMembersCount(team: Team): number {
  if (!team.members) return team.members_count ?? 0
  return team.members.filter(m => m.pivot?.status === 'accepted').length
}

defineExpose({
  fetchTeams,
  openForm: () => { showTeamForm.value = true }
})

onMounted(() => { fetchTeams() })
</script>

<template>
  <div class="mt-6">
    <div v-if="showTeamForm" class="mb-6">
      <TeamForm @created="onTeamCreated" @cancel="showTeamForm = false" />
    </div>

    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-white font-semibold text-lg">My Teams</h3>
        <p class="text-xs text-slate-500">List of teams you participate in or manage.</p>
      </div>
      <div class="flex gap-3">
        <button 
          v-if="!showTeamForm"
          @click="showTeamForm = true" 
          class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
        >
          + Create Team
        </button>
        <button @click="fetchTeams" class="text-slate-400 text-sm hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg transition">
          Refresh
        </button>
      </div>
    </div>

    <div v-if="loading" class="border border-slate-800 rounded-xl p-6 bg-slate-900/20 text-slate-500">Loading teams…</div>

    <div v-else>
      <div v-if="error" class="text-sm text-red-400 mb-3">{{ error }}</div>

      <div v-if="teams.length === 0" class="border border-slate-800 rounded-2xl p-8 text-center bg-slate-900/30">
        <p class="text-slate-500 text-sm">You are not a member of any team yet.</p>
        <p class="text-slate-600 text-xs mt-1">Create your own team or wait for an invitation from other students.</p>
      </div>

      <div v-else class="grid grid-cols-1 gap-4">
        <div 
          v-for="team in teams" 
          :key="team.id" 
          class="border border-slate-800 rounded-xl p-5 bg-slate-900/40 transition flex flex-col justify-between"
          :class="{ 'opacity-85': team.status === 'ready' }"
        >
          <div v-if="editingTeamId === team.id" class="space-y-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 mb-3">
            <div>
              <label class="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Team Name</label>
              <input 
                v-model="editName" 
                type="text" 
                class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label class="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Description</label>
              <textarea 
                v-model="editDescription" 
                rows="2"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
              ></textarea>
            </div>
            <div class="flex justify-end gap-2 text-xs">
              <button 
                @click="cancelEdit" 
                class="border border-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded transition"
              >
                Cancel
              </button>
              <button 
                @click="handleUpdateTeam(team.id)" 
                :disabled="saving"
                class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded font-medium transition disabled:opacity-50"
              >
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>

          <div v-else class="flex items-start justify-between cursor-pointer" @click="toggleExpand(team.id)">
            <div class="space-y-1 flex-1">
              <div class="flex items-center gap-2">
                <div class="text-white font-semibold text-base">{{ team.name }}</div>
                
                <span v-if="team.status === 'ready'" class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-normal">
                  🔒 Locked (Ready)
                </span>

                <span 
                  class="text-xs text-slate-500 inline-block transition-transform duration-200" 
                  :class="{ 'rotate-90 text-blue-400': expandedTeamId === team.id }"
                >
                  ▶
                </span>
              </div>
              <div class="text-slate-400 text-sm line-clamp-2">{{ team.description ?? 'No description provided.' }}</div>
            </div>
            
            <div class="text-right flex flex-col items-end gap-2">
              <span class="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-medium">
                {{ team.members?.length ?? team.members_count ?? 0 }} members
              </span>
              
              <span 
                v-if="getAcceptedMembersCount(team) >= 3" 
                class="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/50"
              >
                Ready for Prog A
              </span>
              <span 
                v-if="getAcceptedMembersCount(team) < 3" 
                class="text-[10px] bg-amber-950/50 text-amber-500 px-2 py-0.5 rounded border border-amber-900/30"
              >
                Needs people for Prog A
              </span>
            </div>
          </div>

          <div v-if="expandedTeamId === team.id" class="mt-4">
            <div v-if="team.leader_id === currentUserId && team.status === 'forming'" class="flex justify-end gap-2 mb-3 pb-3 border-b border-slate-800/60">
              <button 
                @click="startEdit(team)"
                class="text-xs border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white hover:border-slate-700 px-2.5 py-1 rounded transition"
              >
                ✏️ Edit Team
              </button>
              <button 
                @click="handleDeleteTeam(team.id)"
                class="text-xs border border-red-950/40 bg-red-950/10 text-red-400 hover:bg-red-950/30 px-2.5 py-1 rounded transition"
              >
                🗑️ Delete Team
              </button>
            </div>
            
            <div v-else-if="team.leader_id === currentUserId && team.status === 'ready'" class="text-xs text-amber-500/80 bg-amber-950/20 border border-amber-900/30 px-3 py-2 rounded-lg mb-3">
              ℹ️ The data for this command has been frozen because it has already been submitted or approved in the program (Status: Ready). 
            </div>

            <TeamMembersManager 
              :team="team" 
              :is-leader="team.leader_id === currentUserId && team.status === 'forming'" 
              @refresh="fetchTeams" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>