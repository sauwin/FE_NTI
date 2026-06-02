<script setup lang="ts">
defineProps<{
  currentPage: number
  totalPages: number
  totalItems?: number
  loading?: boolean
}>()

const emit = defineEmits<{
  change: [page: number]
}>()
</script>

<template>
  <div
      v-if="totalPages > 1"
      class="flex items-center justify-between pt-4 border-t border-slate-800"
  >
<span class="text-xs font-mono text-slate-500">
Page {{ currentPage }} of {{ totalPages }}<span v-if="totalItems !== undefined"> &middot; {{ totalItems }} total</span>
</span>
    <div class="flex items-center gap-2">
      <button
          @click="emit('change', currentPage - 1)"
          :disabled="currentPage === 1 || loading"
          class="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-slate-300 transition font-mono disabled:opacity-50"
      >
        ← Previous
      </button>
      <button
          @click="emit('change', currentPage + 1)"
          :disabled="currentPage === totalPages || loading"
          class="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-slate-300 transition font-mono disabled:opacity-50"
      >
        Next →
      </button>
    </div>
  </div>
</template>