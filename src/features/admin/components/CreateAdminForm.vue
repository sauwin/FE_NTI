<script setup lang="ts">
import { ref } from 'vue'
import api from '../../../shared/api/axios'

const emit = defineEmits(['created'])

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'nti_admin'
})
const loading = ref(false)
const message = ref('')
const success = ref(false)

const adminRoles = ['nti_admin', 'evaluator', 'content_editor']

async function createAdmin() {
  if (!form.value.first_name || !form.value.last_name || !form.value.email || !form.value.password) {
    message.value = 'All fields required'
    return
  }

  if (form.value.password.length < 8) {
    message.value = 'Password must be at least 8 characters'
    return
  }

  loading.value = true
  try {
    await api.post('/admin/create-admin', {
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      password: form.value.password,
      role: form.value.role
    })
    success.value = true
    message.value = 'Admin created successfully'
    form.value = { first_name: '', last_name: '', email: '', password: '', role: 'nti_admin' }
    emit('created')
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || 'Failed to create admin'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md">
    <form @submit.prevent="createAdmin" class="space-y-4">
      <div>
        <label class="label-small">First Name</label>
        <input v-model="form.first_name" type="text" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>

      <div>
        <label class="label-small">Last Name</label>
        <input v-model="form.last_name" type="text" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>

      <div>
        <label class="label-small">Email</label>
        <input v-model="form.email" type="email" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>

      <div>
        <label class="label-small">Password</label>
        <input v-model="form.password" type="password" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
      </div>

      <div>
        <label class="label-small">Admin Role</label>
        <select v-model="form.role" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
          <option v-for="role in adminRoles" :key="role" :value="role">
            {{ role }}
          </option>
        </select>
      </div>

      <button type="submit" :disabled="loading" class="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium transition">
        {{ loading ? 'Creating...' : 'Create Admin' }}
      </button>

      <div v-if="message" :class="[
'p-3 rounded-lg text-sm',
success
? 'bg-green-900/20 border border-green-800 text-green-400'
: 'bg-red-900/20 border border-red-800 text-red-400'
]">
        {{ message }}
      </div>
    </form>
  </div>
</template>