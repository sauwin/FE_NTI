<script setup lang="ts">
import { ref } from 'vue'
import { createTeam } from '../api/teams'

const emits = defineEmits(['created', 'cancel'])

const name = ref('')
const description = ref('')
const submitting = ref(false)
const errors = ref('')

async function submit() {
  errors.value = ''
  if (!name.value.trim()) {
    errors.value = 'Team name is required.'
    return
  }
  submitting.value = true
  try {
    const res = await createTeam({ name: name.value, description: description.value })
    emits('created', res.data)
    name.value = ''
    description.value = ''
  } catch (e: any) {
    errors.value = e?.response?.data?.message ?? 'Failed to create team.'
  } finally {
    submitting.value = false
  }
}

function cancel() {
  emits('cancel')
}
</script>

<template>
  <div class="mb-6 border border-slate-800 rounded-xl p-5 bg-slate-950/40">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h4 class="text-base font-bold text-white">Create Team</h4>
        <p class="text-sm text-slate-500 mt-1">Set up a new team and invite members by email.</p>
      </div>

      <button
        @click="cancel"
        class="text-xs text-slate-500 hover:text-slate-300 transition cursor-pointer"
      >
        Close
      </button>
    </div>

    <div v-if="errors" class="p-3 rounded-lg text-sm mb-4 border bg-red-900/20 border-red-800 text-red-400 font-mono">
      System Error: {{ errors }}
    </div>

    <div class="grid grid-cols-1 gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-mono uppercase text-slate-500">Team Name</label>
        <input
          v-model="name"
          type="text"
          placeholder="e.g. Team Alpha"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-mono uppercase text-slate-500">Description (Optional)</label>
        <textarea
          v-model="description"
          rows="3"
          placeholder="Briefly describe your team's project or focus..."
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all resize-none"
        />
      </div>

      <div class="flex items-center gap-2 pt-1">
        <button
          @click="submit"
          :disabled="submitting"
          class="text-xs px-3 py-1.5 rounded border bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border-emerald-800 transition disabled:opacity-50 cursor-pointer font-mono uppercase font-semibold"
        >
          {{ submitting ? 'Creating...' : 'Create Team' }}
        </button>

        <button
          @click="cancel"
          type="button"
          class="text-xs px-3 py-1.5 rounded border bg-slate-800 hover:bg-slate-700 text-white border-slate-700 transition font-mono uppercase cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
