<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '../../api/axios'

const props = defineProps<{ users: any[] }>()
const emit = defineEmits(['assigned'])

const searchQuery = ref('')
const selectedUserId = ref('')
const selectedRole = ref('')
const loading = ref(false)
const message = ref('')
const success = ref(false)

const availableRoles = [
  'student',
  'company',
  'mentor',
  'evaluator',
  'content_editor'
]

const filteredUsers = computed(() => {
  if (!searchQuery.value) return []
  return props.users.filter(u =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

function selectUser(userId: number) {
  selectedUserId.value = userId.toString()
  searchQuery.value = ''
}

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
    searchQuery.value = ''
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
        <label class="label-small">Search User</label>
        <div class="relative">
          <input v-model="searchQuery" type="text" placeholder="Name or email..." class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
          <div v-if="searchQuery && filteredUsers.length > 0" class="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 border-t-0 rounded-b-lg max-h-40 overflow-y-auto z-10">
            <button v-for="user in filteredUsers" :key="user.id" @click.prevent="selectUser(user.id)" type="button" class="w-full text-left px-3 py-2 hover:bg-slate-700 text-white text-sm border-b border-slate-700 last:border-b-0">
              <div class="font-medium">{{ user.first_name }} {{ user.last_name }}</div>
              <div class="text-xs text-slate-500">{{ user.email }}</div>
            </button>
          </div>
        </div>
      </div>

      <div v-if="selectedUserId" class="p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-blue-300 text-sm">
        Selected user: {{ props.users.find(u => u.id.toString() === selectedUserId)?.first_name }} {{ props.users.find(u => u.id.toString() === selectedUserId)?.last_name }}
        <button @click.prevent="selectedUserId = ''" class="ml-2 text-blue-400 hover:text-blue-300">Change</button>
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