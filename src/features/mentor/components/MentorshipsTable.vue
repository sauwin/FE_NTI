<script setup lang="ts">
  import type { Mentorship } from '../types/mentorships'

  defineProps<{
    mentorships: Mentorship[]
    loading: boolean
    error: string
    isRequestMode?: boolean
  }>()

  const emit = defineEmits<{
    (e: 'view-project', mentorship: Mentorship): void
    (e: 'accept-request', mentorship: Mentorship): void
    (e: 'reject-request', mentorship: Mentorship): void
  }>()
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="text-blue-400 text-sm">Loading projects data...</div>
    <div v-else-if="error" class="text-red-400 text-sm">{{ error }}</div>
    
    <div v-else-if="mentorships.length === 0" class="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center text-slate-500 text-sm">
      {{ isRequestMode ? 'No pending mentorship requests found.' : 'No active assigned projects.' }}
    </div>

    <div v-else class="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
            <th class="p-4 font-semibold">Team name / Applicant</th>
            <th class="p-4 font-semibold">Program</th>
            <th class="p-4 font-semibold">Appointment date</th>
            <th class="p-4 font-semibold">Status</th>
            <th class="p-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800 text-sm">
          <tr v-for="m in mentorships" :key="m.id" class="hover:bg-slate-850 transition">
            <td class="p-4 font-medium text-white">{{ m.application?.team?.name || 'Without name (Individual)' }}</td>
            <td class="p-4 text-slate-400">{{ m.application?.program?.name || 'N/A' }}</td>
            <td class="p-4 text-slate-400">{{ m.assigned_at ? new Date(m.assigned_at).toLocaleDateString() : '—' }}</td>
            <td class="p-4">
              <span 
                class="px-2 py-1 text-xs rounded-full border"
                :class="m.application?.status === 'onboarding' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'"
              >
                {{ m.application?.status || 'active' }}
              </span>
            </td>
            <td class="p-4 text-right">
              <div class="flex justify-end gap-2">
                <template v-if="isRequestMode">
                  <button 
                    @click="emit('view-project', m)"
                    class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-medium transition"
                  >
                    Review Details
                  </button>
                  <button 
                    @click="emit('accept-request', m)"
                    class="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                  >
                    Accept
                  </button>
                  <button 
                    @click="emit('reject-request', m)"
                    class="border border-red-900 text-red-400 hover:bg-red-950/30 px-3 py-1.5 rounded text-xs font-medium transition"
                  >
                    Reject
                  </button>
                </template>

                <template v-else>
                  <button 
                    @click="emit('view-project', m)"
                    class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium transition"
                  >
                    Show Project & Journal
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>