<script setup lang="ts">
import { ref } from 'vue'
import { createTeam } from '../../../shared/api/teams'

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
  <div class="border border-slate-800 rounded-xl p-6 bg-slate-900/30 mt-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-white font-semibold">Create Team</h3>
      <button @click="cancel" class="text-slate-400 hover:text-white">✕</button>
    </div>

    <div v-if="errors" class="text-sm text-red-400 mb-3">{{ errors }}</div>

    <div class="grid grid-cols-1 gap-3">
      <label class="text-xs text-slate-400">Team name</label>
      <input v-model="name" type="text" placeholder="e.g. Team Alpha"
             class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />

      <label class="text-xs text-slate-400">Description (optional)</label>
      <textarea v-model="description" rows="3"
                class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"/>

      <div class="flex items-center gap-3 pt-2">
        <button @click="submit" :disabled="submitting"
                class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
          {{ submitting ? 'Creating…' : 'Create' }}
        </button>
        <button @click="cancel" type="button" class="border border-slate-700 text-slate-400 px-4 py-2 rounded-lg text-sm">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
