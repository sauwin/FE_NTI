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
    <div v-if="loading && (!activeMembers || activeMembers.length === 0)" class="space-y-4">
      <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50 animate-pulse">
        <div class="h-5 bg-slate-800 rounded mb-4 w-1/4"></div>
        <div class="space-y-3">
          <div v-for="n in 3" :key="n" class="h-10 bg-slate-950/60 rounded-xl border border-slate-800/40 w-full"></div>
        </div>
      </div>
    </div>

    <div v-else-if="!hasMembers" class="bg-slate-900/40 border border-slate-800 rounded-2xl text-center py-10 text-slate-500 text-sm">
      No active company members found
    </div>

    <div v-else class="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/40">
      <table class="w-full text-sm">
        <thead class="border-b border-slate-800 bg-slate-900/50">
          <tr class="text-left text-slate-400 font-mono text-xs uppercase tracking-wider">
            <th class="py-3.5 px-5">Name</th>
            <th class="py-3.5 px-5">Email</th>
            <th class="py-3.5 px-5">Role</th>
            <th class="py-3.5 px-5">Status</th>
            <th class="py-3.5 px-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-slate-300 divide-y divide-slate-800/60">
          <tr 
            v-for="user in visibleMembers" 
            :key="user.id" 
            class="hover:bg-slate-800/20 transition group"
          >
            <td class="py-4 px-5 font-medium text-white">
              {{ user.first_name }} {{ user.last_name }}
            </td>
            <td class="py-4 px-5 text-slate-400 font-mono text-xs">
              {{ user.email }}
            </td>
            <td class="py-4 px-5">
              <div class="flex gap-1 flex-wrap items-center">
                <span class="text-xs bg-blue-600/15 border border-blue-900/40 text-blue-400 px-2.5 py-1 rounded-xl font-medium">
                  {{ user.role_in_org }}
                </span>
              </div>
            </td>
            <td class="py-4 px-5">
              <span class="text-xs px-2.5 py-1 rounded-xl bg-green-950/20 border border-green-900/40 text-green-400 font-medium">
                {{ user.status }}
              </span>
            </td>
            <td class="py-4 px-5 text-right">
              <button 
                @click="$emit('kick', user)" 
                class="text-xs bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/40 px-3 py-1.5 rounded-lg transition"
              >
                Kick Out
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="mt-5 flex items-center justify-center gap-3">
      <button 
        v-if="currentPage > 1" 
        @click="currentPage--" 
        class="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition text-slate-300"
      >
        &larr; Prev
      </button>
      
      <div class="text-xs text-slate-500 font-mono">
        Page <span class="text-slate-300">{{ currentPage }}</span> of <span class="text-slate-300">{{ totalPages }}</span> (<span class="text-slate-400">{{ activeMembers.length }} users</span>)
      </div>
      
      <button 
        v-if="currentPage < totalPages" 
        @click="currentPage++" 
        class="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition text-slate-300"
      >
        Next &rarr;
      </button>
    </div>
  </div>
</template>