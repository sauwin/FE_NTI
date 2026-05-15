<script setup lang="ts">
import { ref } from 'vue'
import api from '../../api/axios'

const props = defineProps<{ users: any[] }>()
const emit = defineEmits(['assigned'])

const selectedUserId = ref('')
const selectedRole = ref('')
const loading = ref(false)
const message = ref('')
const success = ref(false)

const availableRoles = [
  'student',
  'company',
  'mentor',
  'nti_admin',
  'evaluator',
  'content_editor'
]

async function assignRole() {
  if (!selectedUserId.value || !selectedRole.value) {
    message.value = 'Select user and role'
    return
  }

  loading.value = true
  try {
    await api.post(`/admin/users/${selectedUserId.value}/roles`, {
      role: selectedRole.value
    })
    success.value = true
    message.value = 'Role assigned successfully'
    selectedUserId.value = ''
    selectedRole.value = ''
    emit('assigned')
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || 'Failed to assign role'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md">
    <form @submit.prevent="assignRole" class="space-y-4">
      <div>
        <label class="label-small">Select User</label>
        <select v-model="selectedUserId" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">Choose user...</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.first_name }} {{ user.last_name }} ({{ user.email }})
          </option>
        </select>
      </div>

      <div>
        <label class="label-small">Select Role</label>
        <select v-model="selectedRole" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
          <option value="">Choose role...</option>
          <option v-for="role in availableRoles" :key="role" :value="role">
            {{ role }}
          </option>
        </select>
      </div>

      <button type="submit" :disabled="loading" class="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium transition">
        {{ loading ? 'Assigning...' : 'Assign Role' }}
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