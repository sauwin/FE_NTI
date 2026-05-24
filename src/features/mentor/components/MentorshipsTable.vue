<script setup lang="ts">
  import type { Mentorship } from '../api/mentorships'

  defineProps<{
    mentorships: Mentorship[]
    loading: boolean
    error: string
  }>()

  const emit = defineEmits<{
    (e: 'view-project', mentorship: Mentorship): void
  }>()
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="text-blue-400 text-sm">Loading assigned projects...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>
    
    <div v-else-if="mentorships.length === 0" class="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center text-slate-500 text-sm">
      No assigned projects.
    </div>

    <div v-else class="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
            <th class="p-4 font-semibold">Team name</th>
            <th class="p-4 font-semibold">Program</th>
            <th class="p-4 font-semibold">Appointment date</th>
            <th class="p-4 font-semibold">Status</th>
            <th class="p-4 font-semibold text-right">Acrions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800 text-sm">
          <tr v-for="m in mentorships" :key="m.id" class="hover:bg-slate-850 transition">
            <td class="p-4 font-medium text-white">{{ m.application?.team?.name || 'Without name' }}</td>
            <td class="p-4 text-slate-400">{{ m.application?.program?.name || 'N/A' }}</td>
            <td class="p-4 text-slate-400">{{ new Date(m.assigned_at).toLocaleDateString() }}</td>
            <td class="p-4">
              <span class="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {{ m.application?.status || 'active' }}
              </span>
            </td>
            <td class="p-4 text-right">
              <button 
                @click="emit('view-project', m)"
                class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium transition"
              >
                Show project
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>