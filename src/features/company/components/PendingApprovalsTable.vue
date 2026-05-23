<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  pendingUsers: any[]
  loading?: boolean
}>()

const emit = defineEmits(['approve', 'reject'])

const hasPending = computed(() => props.pendingUsers && props.pendingUsers.length > 0)
</script>

<template>
  <div>
    <div v-if="loading" class="text-center py-4 text-slate-400">
      Loading pending members...
    </div>

    <div v-else-if="!hasPending" class="bg-slate-900/40 border border-slate-800 rounded-lg text-center py-6 text-slate-500 text-sm">
      No pending approvals
    </div>

    <div v-else class="overflow-x-auto border border-slate-800 rounded-lg bg-slate-900/20">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-800 bg-slate-900/50">
          <tr class="text-left text-slate-400">
            <th class="py-3 px-4">Name</th>
            <th class="py-3 px-4">Email</th>
            <th class="py-3 px-4">Requested Role</th>
            <th class="py-3 px-4">Created</th>
            <th class="py-3 px-4">Actions</th>
          </tr>
        </thead>

        <tbody class="text-slate-300">
          <tr
            v-for="user in pendingUsers"
            :key="`${user.id}-${user.role_slug}`"
            class="border-b border-slate-800/60 hover:bg-slate-800/20 transition"
          >
            <td class="py-3 px-4 font-medium">
              {{ user.first_name }} {{ user.last_name }}
            </td>
            <td class="py-3 px-4 text-slate-400 text-sm">
              {{ user.email }}
            </td>
            <td class="py-3 px-4">
              <span class="text-xs bg-yellow-600/30 border border-yellow-700 text-yellow-300 px-2 py-1 rounded">
                {{ user.role_slug }}
              </span>
            </td>
            <td class="py-3 px-4 text-xs text-slate-400">
              {{ new Date(user.created_at).toLocaleDateString() }}
            </td>
            <td class="py-3 px-4">
              <div class="flex gap-2">
                <button
                  @click="$emit('approve', user)"
                  class="text-xs bg-green-600/30 hover:bg-green-600/50 text-green-400 px-3 py-1 rounded transition font-medium"
                >
                  Approve
                </button>
                <button
                  @click="$emit('reject', user)"
                  class="text-xs bg-red-600/30 hover:bg-red-600/50 text-red-400 px-3 py-1 rounded transition font-medium"
                >
                  Reject
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>