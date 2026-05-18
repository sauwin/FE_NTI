<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'

interface ActiveCall {
  id: number
  name: string
}

const router = useRouter()

// Сувора типізація полів форми
const activeCalls = ref<ActiveCall[]>([])
const selectedCallId = ref<number | null>(null)
const title = ref<string>('') // Додано обов'язкове поле Title
const brief = ref<string>('')
const budget = ref<number | null>(null)

const loading = ref<boolean>(false)
const error = ref<string>('')

onMounted(async () => {
  try {
    const res = await api.get<ActiveCall[]>('/calls/active?program=b')
    activeCalls.value = res.data
    
    if (res.data.length > 0) {
      selectedCallId.value = res.data[0]?.id ?? null
    }
  } catch (err) {
    error.value = 'Failed to load active application periods.'
  }
})

// Функція приймає статус: зберегти як чернетку або відразу опублікувати
async function submitTask(targetStatus: 'draft' | 'published'): Promise<void> {
  if (!selectedCallId.value) {
    error.value = 'Please select a call period.'
    return
  }
  if (!title.value.trim() || !brief.value.trim()) {
    error.value = 'Title and project brief are required.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Payload узгоджено з бекендом (Prepojenie na call + status)
    await api.post('/company/tasks', {
      call_id: selectedCallId.value,
      title: title.value,
      brief: brief.value,
      budget: budget.value,
      status: targetStatus
    })
    router.push('/programs/b')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Server error. Make sure your payload matches the database schema.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex justify-center items-center min-h-screen py-10">
    <div class="w-full max-w-xl bg-slate-950 p-8 border border-blue-900 rounded-2xl">
      <div class="mb-6 text-center">
        <h1 class="font-bold text-3xl text-white">Create Technical Specification</h1>
        <p class="text-gray-400 text-sm mt-1">Specify brief for student teams (Program B)</p>
      </div>

      <form @submit.prevent class="flex flex-col gap-4">
        <p v-if="error" class="text-red-500 text-sm bg-red-500/10 p-3 border border-red-900 rounded-md">{{ error }}</p>

        <div>
          <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Select Active Period (Call) *</label>
          <select v-model="selectedCallId" class="w-full bg-slate-900 border border-blue-900 rounded-md h-10 px-3 text-white focus:outline-none focus:border-blue-500">
            <option v-for="call in activeCalls" :key="call.id" :value="call.id">
              {{ call.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Challenge Title *</label>
          <input v-model="title" type="text" placeholder="e.g. AI-driven Supply Chain Optimizer" class="w-full bg-blue-600/10 border border-blue-900 rounded-md h-10 px-3 text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Project Brief / Requirements *</label>
          <textarea v-model="brief" rows="6" placeholder="Describe requirements, technology stack, goals..." class="w-full bg-blue-600/10 border border-blue-900 rounded-md p-3 text-white focus:outline-none focus:border-blue-500 resize-none"></textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Project Budget (€) (Optional)</label>
          <input v-model.number="budget" type="number" step="0.01" placeholder="e.g. 2500.00" class="w-full bg-blue-600/10 border border-blue-900 rounded-md h-10 px-3 text-white focus:outline-none focus:border-blue-500" />
        </div>

        <div class="flex gap-3 mt-4">
          <button type="button" @click="router.push('/programs/b')" class="px-4 border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white h-11 rounded-md text-sm transition">Cancel</button>
          
          <button type="button" @click="submitTask('draft')" :disabled="loading" class="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white h-11 rounded-md text-sm font-medium transition">
            Save as Draft
          </button>

          <button type="button" @click="submitTask('published')" :disabled="loading" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-md text-sm font-medium transition">
            Publish Task
          </button>
        </div>
      </form>
    </div>
  </div>
</template>