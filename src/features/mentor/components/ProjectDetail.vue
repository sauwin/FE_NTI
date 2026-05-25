<script setup lang="ts">
import { ref, watch } from 'vue'
import { getMentorshipById, createConsultation } from '../api/mentorships'
import type { Mentorship, Consultation } from '../types/mentorships'

const props = defineProps<{
  mentorship: Mentorship
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const consultations = ref<Consultation[]>([])
const loadingDetail = ref(false)
const showLogForm = ref(false)

const formDate = ref(new Date().toISOString().substr(0, 10))
const formDuration = ref(60)
const formSummary = ref('')
const formSubmitting = ref(false)
const formSuccess = ref('')

const fetchConsultations = async () => {
  loadingDetail.value = true
  formSuccess.value = ''
  try {
    const res = await getMentorshipById(props.mentorship.id)
    consultations.value = res.data.consultations || []
  } catch (err) {
    console.error('Error while loading consultation details', err)
  } finally {
    loadingDetail.value = false
  }
}

const submitConsultation = async () => {
  formSubmitting.value = true
  formSuccess.value = ''
  try {
    const result = await createConsultation(props.mentorship.id, {
      date: formDate.value,
      duration_minutes: formDuration.value,
      summary: formSummary.value,
    })
    
    consultations.value.unshift(result.data.data)
    formSummary.value = ''
    showLogForm.value = false
    formSuccess.value = 'The consultation has been successfully saved!'
  } catch (err: any) {
    alert(err.response?.data?.message || 'Error while saving')
  } finally {
    formSubmitting.value = false
  }
}

watch(() => props.mentorship.id, () => {
  fetchConsultations()
}, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center">
      <button @click="emit('back')" class="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition">
        ← Back to list
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 h-fit">
        <h3 class="text-xl font-bold text-white">{{ mentorship.application?.team?.name }}</h3>
        <p class="text-xs text-slate-500">Assigned by: {{ new Date(mentorship.assigned_at).toLocaleDateString() }}</p>
        
        <div class="border-t border-slate-800 pt-4 space-y-3">
          <div>
            <span class="text-xs text-slate-500 block uppercase tracking-wider">Program</span>
            <span class="text-sm text-slate-300 font-medium">{{ mentorship.application?.program?.name }}</span>
          </div>
          <div>
            <span class="text-xs text-slate-500 block uppercase tracking-wider">Focus</span>
            <span class="text-sm text-slate-400 italic">{{ mentorship.application?.program?.focus || 'Not specified' }}</span>
          </div>
          <div>
            <span class="text-xs text-slate-500 block uppercase tracking-wider">Current status</span>
            <span class="text-sm text-blue-400 font-medium">{{ mentorship.application?.status }}</span>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
        <div class="flex justify-between items-center">
          <h4 class="text-lg font-semibold text-white">Consultation journal</h4>
          <button 
            @click="showLogForm = !showLogForm"
            class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition"
          >
            {{ showLogForm ? 'Cancel' : '＋ Add consultation' }}
          </button>
        </div>

        <div v-if="formSuccess" class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded">
          {{ formSuccess }}
        </div>

        <form v-if="showLogForm" @submit.prevent="submitConsultation" class="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Date</label>
              <input v-model="formDate" type="date" required class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"/>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1">Duration (in minutes)</label>
              <input v-model="formDuration" type="number" min="5" max="480" required class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"/>
            </div>
          </div>
          <div>
            <label class="block text-xs text-slate-400 mb-1">Short content / summary</label>
            <textarea v-model="formSummary" rows="4" required placeholder="Describe what was discussed, what tasks were assigned to the team..." class="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"></textarea>
          </div>
          <div class="text-right">
            <button :disabled="formSubmitting" type="submit" class="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 py-2 rounded text-xs font-medium transition">
              {{ formSubmitting ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>

        <div v-if="loadingDetail" class="text-slate-500 text-sm">Loading history...</div>
        <div v-else-if="consultations.length === 0" class="text-sm text-slate-500 italic">
          No consultations have been scheduled for this project yet.
        </div>
        <div v-else class="space-y-4">
          <div v-for="c in consultations" :key="c.id" class="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-2">
            <div class="flex justify-between items-center border-b border-slate-900 pb-2 text-xs text-slate-400">
              <span class="font-semibold text-slate-300">📅 {{ new Date(c.date).toLocaleDateString() }}</span>
              <span>⏱ {{ c.duration_minutes }} min</span>
            </div>
            <p class="text-sm text-slate-300 whitespace-pre-line">{{ c.summary }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>