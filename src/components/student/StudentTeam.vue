<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as teamsApi from '../../api/teams'

interface TeamMember {
  id: number
  name: string
  email: string
  joined_at: string
}

interface Team {
  id: number
  name: string
  description: string
  leader_id: number
  status: string
  leader: {
    id: number
    name: string
    email: string
  }
  members: TeamMember[]
}

const teams = ref<Team[]>([])
const selectedTeam = ref<Team | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const showTeamForm = ref(false)
const newTeamData = ref({ name: '', description: '' })

const fetchTeams = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await teamsApi.getTeams()
    teams.value = response.data
    if (teams.value.length > 0) {
      selectTeam(teams.value[0])
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load teams'
  } finally {
    loading.value = false
  }
}

const selectTeam = (team: Team) => {
  selectedTeam.value = team
}

const createTeam = async () => {
  if (!newTeamData.value.name.trim()) {
    error.value = 'Team name is required'
    return
  }

  try {
    await teamsApi.createTeam(newTeamData.value)
    newTeamData.value = { name: '', description: '' }
    showTeamForm.value = false
    fetchTeams()
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create team'
  }
}

const deleteTeam = async (teamId: number) => {
  if (!confirm('Are you sure you want to delete this team?')) return

  try {
    await teamsApi.deleteTeam(String(teamId))
    fetchTeams()
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete team'
  }
}

onMounted(() => {
  fetchTeams()
})
</script>

<template>
  <div class="space-y-6">
    <div class="section-label">Manage Your Team</div>

    <div v-if="loading" class="text-slate-400">
      Loading teams...
    </div>

    <div v-else-if="error" class="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
      {{ error }}
    </div>

    <div v-else class="space-y-6">
      <!-- Create Team Section -->
      <div>
        <button v-if="!showTeamForm"
                @click="showTeamForm = true"
                class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition">
          Create New Team
        </button>

        <div v-else class="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <div class="space-y-4">
            <div>
              <label class="label">Team Name</label>
              <input v-model="newTeamData.name"
                     type="text"
                     placeholder="Enter team name"
                     class="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="label">Description (Optional)</label>
              <textarea v-model="newTeamData.description"
                        placeholder="Enter team description"
                        rows="3"
                        class="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"></textarea>
            </div>
            <div class="flex gap-2">
              <button @click="createTeam"
                      class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                Create
              </button>
              <button @click="showTeamForm = false"
                      class="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Teams List -->
      <div>
        <div class="label-hint mb-3">Your Teams</div>
        <div v-if="teams.length === 0" class="bg-slate-900/50 rounded-lg p-6 text-center text-slate-400">
          No teams yet. Create one to get started!
        </div>

        <div v-else class="space-y-3">
          <button v-for="team in teams"
                  :key="team.id"
                  @click="selectTeam(team)"
                  :class="[
                    'w-full text-left px-4 py-3 rounded-lg border transition',
                    selectedTeam?.id === team.id
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  ]">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-semibold text-white">{{ team.name }}</h4>
                <p class="text-sm text-slate-400">{{ team.members?.length || 0 }} members</p>
              </div>
              <span :class="[
                'text-xs font-semibold px-2 py-1 rounded',
                team.status === 'draft' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-green-900/50 text-green-400'
              ]">
                {{ team.status }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Team Details -->
      <div v-if="selectedTeam" class="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-bold text-white">{{ selectedTeam.name }}</h3>
            <p v-if="selectedTeam.description" class="text-slate-400 text-sm mt-2">{{ selectedTeam.description }}</p>
          </div>
          <button v-if="selectedTeam.leader_id === (teams[0]?.leader_id)"
                  @click="deleteTeam(selectedTeam.id)"
                  class="text-red-400 hover:text-red-300 text-sm font-medium">
            Delete
          </button>
        </div>

        <!-- Team Leader -->
        <div class="mb-6">
          <div class="label-hint mb-2">Team Leader</div>
          <div class="bg-slate-800/50 rounded p-3">
            <p class="font-semibold text-white">{{ selectedTeam.leader.name }}</p>
            <p class="text-sm text-slate-400">{{ selectedTeam.leader.email }}</p>
          </div>
        </div>

        <!-- Team Members -->
        <div>
          <div class="label-hint mb-2">Team Members</div>
          <div v-if="selectedTeam.members?.length" class="space-y-2">
            <div v-for="member in selectedTeam.members"
                 :key="member.id"
                 class="bg-slate-800/50 rounded p-3 flex justify-between items-center">
              <div>
                <p class="font-semibold text-white">{{ member.name }}</p>
                <p class="text-sm text-slate-400">{{ member.email }}</p>
              </div>
              <p class="text-xs text-slate-500">Joined {{ new Date(member.joined_at).toLocaleDateString() }}</p>
            </div>
          </div>
          <div v-else class="text-slate-400 text-sm">
            No members yet
          </div>
        </div>
      </div>
    </div>
  </div>
</template>