<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/shared/api/axios.ts'
import { getCallEvaluators, assignEvaluator, removeEvaluator } from '@/features/evaluation/api/evaluations.ts'

const calls = ref<any[]>([])
const selectedCallId = ref<number | null>(null)
const evaluators = ref<any[]>([])
const allUsers = ref<any[]>([])
const selectedUserId = ref<number | null>(null)
const loading = ref(false)
const error = ref('')
const success = ref('')

onMounted(async () => {
  try {
    const [callsRes, usersRes] = await Promise.all([
      api.get('/admin/calls'),
      api.get('/admin/users'),
    ])
    calls.value = callsRes.data?.data ?? callsRes.data ?? []
    allUsers.value = (usersRes.data ?? []).filter((u: any) =>
        u.roles?.some((r: any) => r.slug === 'evaluator')
    )
  } catch {
    error.value = 'Could not load data'
  }
})

async function loadEvaluators() {
  if (!selectedCallId.value) return
  loading.value = true
  try {
    const res = await getCallEvaluators(selectedCallId.value)
    evaluators.value = res.data ?? []
  } catch {
    error.value = 'Could not load evaluators'
  } finally {
    loading.value = false
  }
}

async function assign() {
  if (!selectedCallId.value || !selectedUserId.value) return
  error.value = ''
  try {
    await assignEvaluator(selectedCallId.value, selectedUserId.value)
    success.value = 'Evaluator assigned.'
    selectedUserId.value = null
    await loadEvaluators()
    setTimeout(() => (success.value = ''), 3000)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Could not assign evaluator'
  }
}

async function remove(userId: number) {
  if (!selectedCallId.value) return
  error.value = ''
  try {
    await removeEvaluator(selectedCallId.value, userId)
    evaluators.value = evaluators.value.filter(e => e.id !== userId)
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Could not remove evaluator'
  }
}
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    <h3 class="text-xl font-bold text-white mb-6">Call Evaluators</h3>

    <p v-if="error" class="text-red-400 text-sm mb-4">{{ error }}</p>
    <p v-if="success" class="text-green-400 text-sm mb-4">{{ success }}</p>

    <div class="flex gap-3 mb-6 flex-wrap">
      <select
          v-model="selectedCallId"
          @change="loadEvaluators"
          class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none">
        <option :value="null" disabled>Select call...</option>
        <option v-for="c in calls" :key="c.id" :value="c.id">{{ c.name }} (#{{ c.id }})</option>
      </select>
    </div>

    <div v-if="selectedCallId">
      <div class="flex gap-3 mb-6 flex-wrap items-center">
        <select
            v-model="selectedUserId"
            class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none">
          <option :value="null" disabled>Select evaluator to assign...</option>
          <option v-for="u in allUsers" :key="u.id" :value="u.id">{{ u.first_name }} {{ u.last_name }} ({{ u.email }})</option>
        </select>
        <button
            @click="assign"
            :disabled="!selectedUserId"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          Assign
        </button>
      </div>

      <div v-if="loading" class="text-slate-500 animate-pulse text-sm">Loading evaluators...</div>

      <div v-else-if="evaluators.length === 0" class="text-slate-500 text-sm">No evaluators assigned to this call.</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="text-xs text-slate-400 uppercase font-mono bg-slate-900/50">
          <tr>
            <th class="px-4 py-3">Name</th>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Assigned at</th>
            <th class="px-4 py-3 text-right">Action</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="ev in evaluators" :key="ev.id" class="border-b border-slate-800 hover:bg-slate-800/30 transition">
            <td class="px-4 py-3 text-white">{{ ev.name }}</td>
            <td class="px-4 py-3 text-slate-400">{{ ev.email }}</td>
            <td class="px-4 py-3 text-slate-500 text-xs">{{ ev.assigned_at ? new Date(ev.assigned_at).toLocaleDateString() : '—' }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="remove(ev.id)" class="text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-3 py-1.5 rounded-lg transition">
                Remove
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>