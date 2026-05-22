<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTeams } from '../../api/teams'

const loading = ref(false)
const teams = ref<any[]>([])
const error = ref('')

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

onMounted(() => { fetchTeams() })
</script>

<template>
  <div class="mt-6">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-white font-semibold">My Teams</h3>
      <button @click="fetchTeams" class="text-slate-400 text-sm hover:text-white">Refresh</button>
    </div>

    <div v-if="loading" class="border border-slate-800 rounded-xl p-6 bg-slate-900/20 text-slate-500">Loading teams…</div>

    <div v-else>
      <div v-if="error" class="text-sm text-red-400 mb-3">{{ error }}</div>

      <div v-if="teams.length === 0" class="border border-slate-800 rounded-2xl p-8 text-center bg-slate-900/30">
        <p class="text-slate-500 text-sm">No teams yet.</p>
        <p class="text-slate-600 text-xs mt-1">Create or join a team to collaborate.</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="team in teams" :key="team.id" class="border border-slate-800 rounded-xl p-4 bg-slate-900/30">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-white font-semibold text-sm">{{ team.name }}</div>
              <div class="text-slate-500 text-xs mt-1">{{ team.description ?? '—' }}</div>
            </div>
            <div class="text-xs text-slate-400 text-right mt-[4%]">
              <div class="font-medium text-slate-300">{{ team.members?.length ?? team.members_count ?? 0 }} members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
