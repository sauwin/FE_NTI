<script setup lang="ts">
import { ref } from 'vue'
import { createAdmin as createAdminUser } from '@/features/admin/api/admin'

const emit = defineEmits(['created'])

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: ''
})
const loading = ref(false)
const message = ref('')
const success = ref(false)

const adminRoles = {
  nti_admin: 'NTI Admin', 
  evaluator: 'Evaluator', 
  content_editor: 'Content Editor', 
  mentor: 'Mentor'
}

async function createAdmin() {
  if (!form.value.first_name || !form.value.last_name || !form.value.email || !form.value.password) {
    message.value = 'All fields required'
    success.value = false
    return
  }

  if (form.value.password.length < 8) {
    message.value = 'Password must be at least 8 characters'
    success.value = false
    return
  }

  loading.value = true
  try {
    await createAdminUser({
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      password: form.value.password,
      role: form.value.role,
    })
    success.value = true
    message.value = 'Admin created successfully'
    form.value = { first_name: '', last_name: '', email: '', password: '', role: '' }
    emit('created')
    setTimeout(() => { success.value = false; message.value = '' }, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || 'Failed to create admin'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] w-full p-4">
    <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 max-w-md">
      <h3 class="text-xl font-bold text-white mb-6">New Admin</h3>

      <form @submit.prevent="createAdmin" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">First Name</label>
            <input
              v-model="form.first_name"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-600 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Last Name</label>
            <input
              v-model="form.last_name"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-600 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-600 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Password</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-600 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Admin Role</label>
          <select
            v-model="form.role"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-600 outline-none transition"
          >
            <option value="" disabled>Select a role</option>
            <option v-for="(label, key) in adminRoles" :key="key" :value="key" class="bg-slate-950 text-white">
              {{ label }}
            </option>
          </select>
        </div>

        <div
          v-if="message"
          class="px-4 py-3 rounded-xl text-sm font-mono border"
          :class="success
            ? 'bg-emerald-950/60 border-emerald-900 text-emerald-400'
            : 'bg-red-950/40 border-red-900 text-red-400'"
        >
          {{ message }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
        >
          {{ loading ? 'Creating...' : 'Create Admin' }}
        </button>
      </form>
    </div>
  </div>
</template>