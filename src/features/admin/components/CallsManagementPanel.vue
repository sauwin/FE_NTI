<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAdminCalls, deleteAdminCall } from '@/features/admin/api/admin'

const calls = ref<any[]>([])

const loadCalls = async () => {
  const res = await getAdminCalls()
  calls.value = res.data
}

const deleteCall = async (id: number) => {
  if (!confirm('Are you sure you want to delete this draft call?')) return
  try {
    await deleteAdminCall(id)
    await loadCalls()
  } catch (e: any) {
    alert(e.response?.data?.message || 'Error deleting call')
  }
}

onMounted(loadCalls)
</script>

<template>
  <div class="bg-slate-950 p-6 rounded-xl border border-slate-900">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-white font-bold text-xl">System Calls (Výzvy)</h2>
      <router-link to="/admin/calls/create" class="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700">
        + Create New Call
      </router-link>
    </div>

    <table class="w-full text-left text-sm text-gray-400">
      <thead class="bg-slate-900 text-xs uppercase text-gray-500">
        <tr>
          <th class="p-3">Program</th>
          <th class="p-3">Status</th>
          <th class="p-3">Deadline</th>
          <th class="p-3">Required Docs Count</th>
          <th class="p-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="call in calls" :key="call.id" class="border-b border-slate-900 hover:bg-slate-900/50">
          <td class="p-3 font-semibold text-white">{{ call.program?.code.toUpperCase() }}</td>
          <td class="p-3">
            <span :class="{
              'text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded text-xs': call.status === 'draft',
              'text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-xs': call.status === 'open',
              'text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-xs': call.status === 'closed'
            }">{{ call.status }}</span>
          </td>
          <td class="p-3">{{ call.deadline_at ? new Date(call.deadline_at).toLocaleDateString() : 'No deadline' }}</td>
          <td class="p-3">{{ call.required_documents?.length || 0 }} rules</td>
          <td class="p-3 flex gap-2">
            <router-link :to="`/admin/calls/${call.id}/edit`" class="text-blue-400 hover:underline">Edit</router-link>
            <button v-if="call.status === 'draft'" @click="deleteCall(call.id)" class="text-red-400 hover:underline ml-2">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>