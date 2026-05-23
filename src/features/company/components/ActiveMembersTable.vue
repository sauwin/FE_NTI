<script setup lang="ts">
import { ref, computed } from 'vue'

const USERS_PER_PAGE = 25

const props = defineProps<{
  activeMembers: any[]
  loading?: boolean
}>()

const emit = defineEmits(['kick'])

// Simple navigation pagination state
const currentPage = ref(1)

const hasMembers = computed(() => props.activeMembers && props.activeMembers.length > 0)
const totalPages = computed(() => Math.ceil((props.activeMembers?.length || 0) / USERS_PER_PAGE))

// Slice list based on current page
const visibleMembers = computed(() => {
  const start = (currentPage.value - 1) * USERS_PER_PAGE
  return (props.activeMembers || []).slice(start, start + USERS_PER_PAGE)
})
</script>

<template>
  <div>
    <div v-if="loading && (!activeMembers || activeMembers.length === 0)" class="text-center py-4 text-slate-400">
      Loading active members...
    </div>

    <div v-else-if="!hasMembers" class="bg-slate-900/40 border border-slate-800 rounded-lg text-center py-6 text-slate-500 text-sm">
      No active company members found
    </div>

    <div v-else class="overflow-x-auto border border-slate-800 rounded-lg bg-slate-900/20">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-800 bg-slate-900/50">
          <tr class="text-left text-slate-400">
            <th class="py-2 px-4">Name</th>
            <th class="py-2 px-4">Email</th>
            <th class="py-2 px-4">Role</th>
            <th class="py-2 px-4">Status</th>
            <th class="py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody class="text-slate-300">
          <tr 
            v-for="user in visibleMembers" 
            :key="user.id" 
            class="border-b border-slate-800/60 hover:bg-slate-800/20 transition"
          >
            <td class="py-3 px-4 font-medium">
              {{ user.first_name }} {{ user.last_name }}
            </td>
            <td class="py-3 px-4 text-slate-500">
              {{ user.email }}
            </td>
            <td class="py-3 px-4">
              <div class="flex gap-1 flex-wrap items-center">
                <span class="text-xs bg-blue-600/30 border border-blue-700 text-blue-300 px-2 py-1 rounded">
                  {{ user.role_in_org }}
                </span>
              </div>
            </td>
            <td class="py-3 px-4">
              <span class="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400">
                {{ user.status }}
              </span>
            </td>
            <td class="py-3 px-4">
              <button 
                @click="$emit('kick', user)" 
                class="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-900/50 px-2.5 py-1 rounded transition"
              >
                Kick Out
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="mt-4 flex items-center justify-center gap-2">
      <button 
        v-if="currentPage > 1" 
        @click="currentPage--" 
        class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded border border-slate-800 transition"
      >
        &larr; Prev
      </button>
      <div class="text-sm text-slate-400">
        Page {{ currentPage }} of {{ totalPages }} ({{ activeMembers.length }} users)
      </div>
      <button 
        v-if="currentPage < totalPages" 
        @click="currentPage++" 
        class="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded border border-slate-800 transition"
      >
        Next &rarr;
      </button>
    </div>
  </div>
</template>