<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTeams, deleteTeam, updateTeam } from '../api/teams'
import type { Team } from '../types/teams'
import TeamForm from './TeamForm.vue'
import TeamMembersManager from './TeamMembersManager.vue'
import {useConfirm} from "@/shared/composables/useConfirm.ts";

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
    error.value = e?.response?.data?.message ?? 'Failed to load team assets.'
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
    alert(e?.response?.data?.message ?? 'Failed to mutate team resource.')
  } finally {
    saving.value = false
  }
}

async function handleDeleteTeam(teamId: number) {
  const confirmed = await useConfirm({
    title: 'Purge Team',
    message: 'Are you sure you want to permanently purge this team instance? This action is irreversible.',
    confirmText: 'Purge team',
    cancelText: 'Cancel',
    danger: true,
  })
  if (!confirmed) {
    return
  }
  try {
    await deleteTeam(teamId)
    if (expandedTeamId.value === teamId) expandedTeamId.value = null
    await fetchTeams()
  } catch (e: any) {
    alert(e?.response?.data?.message ?? 'Failed to terminate team scope.')
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
  <div class="space-y-6 text-slate-200">
    <div v-if="showTeamForm">
      <TeamForm @created="onTeamCreated" @cancel="showTeamForm = false" />
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
      <div>
        <h3 class="text-xl font-bold text-white tracking-tight">Teams Registry</h3>
        <p class="text-sm text-slate-400 font-mono mt-1">List of team containers you participate in or manage.</p>
      </div>
      <div class="flex items-center gap-3 font-mono text-sm">
        <button 
          v-if="!showTeamForm"
          @click="showTeamForm = true" 
          class="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-600 text-white font-medium transition cursor-pointer"
        >
          Create Team
        </button>
        <button 
          @click="fetchTeams" 
          class="bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
        >
          Refresh
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-slate-400 animate-pulse py-6 font-mono text-sm">
      Loading repository data instances...
    </div>

    <div v-else>
      <div v-if="error" class="text-sm font-mono text-red-400 border border-red-900 bg-red-950/20 p-4 rounded-xl mb-4">
        Error: {{ error }}
      </div>

      <div v-if="teams.length === 0" class="border border-slate-800 border-dashed rounded-xl p-12 text-center bg-slate-950/40">
        <p class="text-slate-300 text-base font-semibold">No team instances found.</p>
        <p class="text-slate-400 text-sm mt-2 font-mono">Create a new scope container or wait for an inbound invitation payload.</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="team in teams" 
          :key="team.id" 
          class="border border-slate-700 bg-slate-900/40 rounded-xl p-5 transition-all flex flex-col justify-between hover:border-slate-500"
          :class="{ 'opacity-50 border-slate-800': team.status === 'ready' }"
        >
          <div v-if="editingTeamId === team.id" class="space-y-4 bg-slate-950/60 p-5 rounded-lg border border-slate-700 mb-2">
            <div class="flex flex-col gap-2">
              <label class="text-xs text-slate-300 font-mono uppercase tracking-wider font-bold">Team Name</label>
              <input 
                v-model="editName" 
                type="text" 
                class="w-full bg-slate-950 border border-slate-600 rounded px-4 py-2 text-sm text-white outline-none font-mono focus:border-slate-400"
              />
            </div>
            
            <div class="flex flex-col gap-2">
              <label class="text-xs text-slate-300 font-mono uppercase tracking-wider font-bold">Description</label>
              <textarea 
                v-model="editDescription" 
                rows="3"
                class="w-full bg-slate-950 border border-slate-600 rounded px-4 py-2 text-sm text-white outline-none resize-none font-mono focus:border-slate-400"
              ></textarea>
            </div>
            
            <div class="flex justify-end gap-3 font-mono text-sm pt-2">
              <button 
                @click="cancelEdit" 
                class="bg-slate-900 text-slate-300 hover:text-white px-4 py-2 rounded border border-slate-700 transition"
              >
                Cancel
              </button>
              <button 
                @click="handleUpdateTeam(team.id)" 
                :disabled="saving"
                class="bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded border border-slate-500 transition disabled:opacity-40"
              >
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </div>

          <div v-else class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer" @click="toggleExpand(team.id)">
            <div class="space-y-2 flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <div class="text-white font-bold text-lg tracking-tight">{{ team.name }}</div>
                
                <span v-if="team.status === 'ready'" class="text-xs text-slate-400 border border-slate-600 px-2 py-0.5 rounded font-mono uppercase tracking-wider bg-slate-950">
                  Locked
                </span>

                <span class="text-xs font-mono px-2 py-0.5 rounded border border-slate-700 bg-slate-950 text-white font-medium">
                  {{ expandedTeamId === team.id ? 'Collapse [-]' : 'Expand [+]' }}
                </span>
              </div>
              <div class="text-slate-300 text-sm font-normal line-clamp-2 leading-relaxed">
                {{ team.description ?? 'No description metadata payload provided.' }}
              </div>
            </div>
            
            <div class="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-2.5 font-mono text-xs">
              <span class="text-white font-semibold bg-slate-950 border border-slate-700 px-2 py-1 rounded">
                {{ team.members?.length ?? team.members_count ?? 0 }} nodes
              </span>
              
              <span 
                v-if="getAcceptedMembersCount(team) >= 3" 
                class="text-white border border-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-900/60"
              >
                Prog A: Complete
              </span>
              <span 
                v-else
                class="text-slate-400 border border-slate-800 px-2 py-0.5 rounded font-medium uppercase tracking-wider bg-slate-950/40"
              >
                Prog A: Incomplete
              </span>
            </div>
          </div>

          <div v-if="expandedTeamId === team.id" class="mt-4 pt-4 border-t border-slate-700">
            <div v-if="team.leader_id === currentUserId && team.status === 'forming'" class="flex justify-end gap-4 mb-4 pb-4 border-b border-slate-800 font-mono text-sm">
              <button 
                @click="startEdit(team)"
                class="text-white hover:underline transition font-medium"
              >
                [ Modify Metadata ]
              </button>
              <button 
                @click="handleDeleteTeam(team.id)"
                class="text-red-400 hover:text-red-300 transition font-medium"
              >
                [ Purge Container ]
              </button>
            </div>
            
            <div v-else-if="team.leader_id === currentUserId && team.status === 'ready'" class="text-sm font-mono text-slate-300 border border-slate-700 bg-slate-950 p-3 rounded-xl mb-4 leading-relaxed">
              State Locked: Data configuration is verified and strictly non-modifiable.
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