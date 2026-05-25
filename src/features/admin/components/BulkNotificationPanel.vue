<script setup>
import { ref } from 'vue'
import api from '@/shared/api/axios'

const recipientGroup = ref('all')
const subject = ref('')
const message = ref('')
const status = ref(null)
const loading = ref(false)

const groups = [
  { value: 'all', label: 'All Users' },
  { value: 'students', label: 'Students' },
  { value: 'companies', label: 'Companies' },
  { value: 'mentors', label: 'Mentors' },
]

async function send() {
  loading.value = true
  status.value = null
  try {
    const res = await api.post('/admin/notifications/bulk', {
      recipient_group: recipientGroup.value,
      subject: subject.value,
      message: message.value,
    })
    status.value = { ok: true, text: `Queued for ${res.data.queued} users` }
    subject.value = ''
    message.value = ''
  } catch (e) {
    status.value = { ok: false, text: e.response?.data?.message || e.message }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
      <span class="text-red-400 text-xl">⚠</span>
      <p class="text-red-300 text-sm">This sends an email to every matched user. Cannot be undone.</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-300 mb-2">Recipients</label>
      <select v-model="recipientGroup" class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none appearance-none">
        <option v-for="g in groups" :key="g.value" :value="g.value">{{ g.label }}</option>
      </select>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-300 mb-2">Subject</label>
      <input v-model="subject" maxlength="255" placeholder="Email subject..." class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none" />
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-300 mb-2">Message</label>
      <textarea v-model="message" maxlength="10000" rows="6" placeholder="Message body..." class="w-full bg-[#0B1120] border border-slate-800 rounded-lg px-3 py-2 text-white text-sm focus:border-red-700 focus:ring-1 focus:ring-red-700 outline-none resize-none" />
    </div>

    <button
        :disabled="loading || !subject || !message"
        @click="send"
        class="px-5 py-2 bg-red-900 hover:bg-red-800 border border-red-700 text-white text-sm rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
    >
      {{ loading ? 'Sending...' : 'Send Notification' }}
    </button>

    <p v-if="status" :class="status.ok ? 'text-green-400' : 'text-red-400'" class="text-sm">
      {{ status.text }}
    </p>
  </div>
</template>