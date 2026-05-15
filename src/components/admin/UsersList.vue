<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../../api/axios'

const users = ref([])
const loading = ref(false)
const error = ref('')

async function fetchUsers() {
  loading.value = true
  try {
    const res = await api.get('/admin/users')
    users.value = res.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchUsers())
</script>

<template>
  <div>
    <div v-if="error" class="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm mb-4">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-8 text-slate-500">
      Loading users...
    </div>

    <div v-else-if="users.length === 0" class="text-center py-8 text-slate-500">
      No users found
    </div>

    <div v-else class="space-y-2">
      <div v-for="user in users" :key="user.id" class="border border-slate-800 rounded-lg p-4 bg-slate-900/30 flex justify-between items-center">
        <div>
          <div class="text-white font-medium">{{ user.first_name }} {{ user.last_name }}</div>
          <div class="text-slate-500 text-sm">{{ user.email }}</div>
          <div class="flex gap-2 mt-2">
<span v-for="role in user.roles" :key="role.id" class="text-xs bg-blue-600/30 border border-blue-700 text-blue-300 px-2 py-0.5 rounded">
{{ role.slug }}
</span>
          </div>
        </div>
        <div class="text-right">
          <div :class="[
'text-xs px-2 py-1 rounded',
user.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
]">{{ user.status }}</div>
          <div class="text-slate-600 text-xs mt-1">{{ new Date(user.created_at).toLocaleDateString() }}</div>
        </div>
      </div>
    </div>
  </div>
</template>