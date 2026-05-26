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
    errors.value = 'Team name specification is required.'
    return
  }
  submitting.value = true
  try {
    const res = await createTeam({ name: name.value, description: description.value })
    emits('created', res.data)
    name.value = ''
    description.value = ''
  } catch (e: any) {
    errors.value = e?.response?.data?.message ?? 'Failed to provision team container.'
  } finally {
    submitting.value = false
  }
}

function cancel() {
  emits('cancel')
}
</script>

<template>
  <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/20 mt-6">
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="text-lg font-bold text-white">Create Team Container</h3>
        <p class="text-xs text-slate-500 font-mono mt-0.5">Initialize a new isolated squad scope</p>
      </div>
      
      <button 
        @click="cancel" 
        class="text-xs font-mono text-slate-500 hover:text-slate-300 transition cursor-pointer"
      >
        Close
      </button>
    </div>

    <div v-if="errors" class="text-xs font-mono text-red-400 bg-red-950/20 border border-red-900/40 p-4 rounded-xl mb-4">
      System Error: {{ errors }}
    </div>

    <div class="grid grid-cols-1 gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">
          Team Name
        </label>
        <input 
          v-model="name" 
          type="text" 
          placeholder="e.g. Team Alpha"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-700 focus:border-blue-600 outline-none transition-all font-mono" 
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">
          Description (Optional)
        </label>
        <textarea 
          v-model="description" 
          rows="3"
          placeholder="Provide technical scope definition..."
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-700 focus:border-blue-600 outline-none transition-all resize-none font-mono"
        />
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button 
          @click="submit" 
          :disabled="submitting"
          class="text-xs bg-emerald-900/40 hover:bg-emerald-900/60 px-4 py-2 rounded-xl text-emerald-400 border border-emerald-800 transition-all font-mono font-semibold cursor-pointer disabled:opacity-40"
        >
          {{ submitting ? 'Processing...' : 'Create Scope' }}
        </button>
        
        <button 
          @click="cancel" 
          type="button" 
          class="text-xs bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 transition-all font-mono font-medium cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>