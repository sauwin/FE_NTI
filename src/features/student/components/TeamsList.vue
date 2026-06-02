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
    await useConfirm({
      title: 'Error',
      message: e?.response?.data?.message ?? 'Failed to update team.',
      confirmText: 'Okay',
      danger: false,
    })
  } finally {
    saving.value = false
  }
}

async function handleDeleteTeam(teamId: number) {
  const confirmed = await useConfirm({
    title: 'Delete Team',
    message: 'Are you sure you want to delete this team? This action cannot be undone.',
    confirmText: 'Delete',
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
    await useConfirm({
      title: 'Error',
      message: e?.response?.data?.message ?? 'Failed to delete team.',
      confirmText: 'Okay',
      danger: false,
    })
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
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h3 class="text-xl font-bold text-white">Manage Teams</h3>
        <p class="text-sm text-slate-500 mt-1">
          Create and manage the teams you lead or belong to.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="!showTeamForm"
          @click="showTeamForm = true"
          class="text-xs px-3 py-1.5 rounded border bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border-emerald-800 transition font-mono uppercase cursor-pointer font-semibold"
        >
          Create Team
        </button>
        <button
          @click="fetchTeams"
          class="text-xs bg-slate-900/40 hover:bg-slate-800/50 px-4 py-2 rounded text-slate-400 border border-slate-800 transition-all font-mono cursor-pointer"
        >
          Refresh
        </button>
      </div>
    </div>

    <TeamForm v-if="showTeamForm" @created="onTeamCreated" @cancel="showTeamForm = false" />

    <div v-if="error" class="p-3 rounded-lg text-sm mb-6 border bg-red-900/20 border-red-800 text-red-400 font-mono">
      System Error: {{ error }}
    </div>

    <div v-if="loading" class="text-slate-500 animate-pulse py-12 text-center font-mono text-sm">
      Loading teams...
    </div>

    <div v-else>
      <div v-if="teams.length === 0" class="border border-slate-800 border-dashed rounded-2xl p-12 text-center bg-slate-900/10">
        <p class="text-slate-400 text-base font-medium">No teams found.</p>
        <p class="text-slate-600 text-xs mt-1.5">Create a new team or accept an invitation to join one.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="team in teams"
          :key="team.id"
          class="border rounded-xl p-5 flex flex-col transition-all"
          :class="team.status === 'ready'
            ? 'border-slate-800 bg-slate-950/40 opacity-75'
            : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/20'
          "
        >
          <div v-if="editingTeamId === team.id" class="space-y-4 bg-slate-900/20 p-5 rounded-xl border border-slate-800 mb-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-mono uppercase text-slate-500">Team Name</label>
              <input
                v-model="editName"
                type="text"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-mono uppercase text-slate-500">Description</label>
              <textarea
                v-model="editDescription"
                rows="3"
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button
                @click="handleUpdateTeam(team.id)"
                :disabled="saving"
                class="text-xs px-3 py-1.5 rounded border bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 border-blue-800 transition disabled:opacity-50 cursor-pointer font-mono uppercase"
              >
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button
                @click="cancelEdit"
                class="text-xs px-3 py-1.5 rounded border bg-slate-800 hover:bg-slate-700 text-white border-slate-700 transition font-mono uppercase cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

          <div v-else class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer" @click="toggleExpand(team.id)">
            <div class="space-y-2 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <div class="text-white font-bold text-base tracking-tight">{{ team.name }}</div>

                <span
                  v-if="team.status === 'ready'"
                  class="text-xs px-2 py-0.5 rounded border font-mono uppercase bg-slate-800 text-slate-400 border-slate-700"
                >
                  Locked
                </span>

                <span class="text-xs font-mono px-2 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-400 uppercase">
                  {{ expandedTeamId === team.id ? 'Collapse' : 'Expand' }}
                </span>
              </div>
              <div class="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                {{ team.description ?? 'No description provided.' }}
              </div>
            </div>

            <div class="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-2">
              <span class="text-xs font-mono px-2 py-1 rounded border bg-slate-900 text-slate-400 border-slate-800 uppercase">
                {{ team.members?.length ?? team.members_count ?? 0 }} members
              </span>

              <span
                v-if="getAcceptedMembersCount(team) >= 3"
                class="text-xs px-2 py-0.5 rounded border font-mono uppercase bg-emerald-950/60 text-emerald-400 border-emerald-900/80"
              >
                Prog A: Complete
              </span>
              <span
                v-else
                class="text-xs px-2 py-0.5 rounded border font-mono uppercase bg-slate-900/40 text-slate-400 border-slate-800"
              >
                Prog A: Incomplete
              </span>
            </div>
          </div>

          <div v-if="expandedTeamId === team.id" class="mt-4 pt-4 border-t border-slate-800">
            <div v-if="team.leader_id === currentUserId && team.status === 'forming'" class="flex justify-end gap-2 pb-4">
              <button
                @click="startEdit(team)"
                class="text-xs px-3 py-1 rounded border bg-slate-800 hover:bg-slate-700 text-white border-slate-700 transition cursor-pointer"
              >
                Edit
              </button>
              <button
                @click="handleDeleteTeam(team.id)"
                class="text-xs px-3 py-1 rounded border bg-red-900/40 hover:bg-red-900/60 text-red-400 border-red-800 transition cursor-pointer"
              >
                Delete
              </button>
            </div>

            <div v-else-if="team.leader_id === currentUserId && team.status === 'ready'" class="text-sm text-slate-400 border border-slate-800 bg-slate-950/60 p-3 rounded-xl mb-4 leading-relaxed">
              This team is locked and can no longer be modified.
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