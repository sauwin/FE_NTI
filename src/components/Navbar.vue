<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api/axios'

const router = useRouter()
const auth = useAuthStore()
const isLoggedIn = ref(false)

const unread = ref(0)
const notifications = ref<any[]>([])
const notifOpen = ref(false)

onMounted(async () => {
  isLoggedIn.value = !!localStorage.getItem('token')
  if (isLoggedIn.value) {
    try {
      const res = await api.get('/notifications')
      unread.value = res.data.unread_count
      notifications.value = res.data.notifications
    } catch {}
  }
})
async function markRead(n: any) {
  if (n.status === 'queued') {
    await api.patch(`/notifications/${n.id}/read`)
    n.status = 'sent'
    unread.value = Math.max(0, unread.value - 1)
  }
}
async function markAllRead() {
  await api.patch('/notifications/read-all')
  unread.value = 0
  notifications.value = notifications.value.map(n => ({ ...n, status: 'sent' }))
}

function logout() {
  auth.logout()
  isLoggedIn.value = false
  router.push('/auth/login')
}
</script>

<template>
  <nav class="w-screen h-14 flex justify-between items-center px-10 fixed top-0 z-50 bg-[#080f1e]/90 backdrop-blur border-b border-slate-800">

    <!-- Logo -->
    <router-link to="/" class="flex items-center gap-2 font-bold text-xl text-white">
      <img src="/logo.png" class="h-8 w-8">
      NTI
    </router-link>

    <!-- Links -->
    <div class="flex items-center gap-7 text-sm">
      <router-link class="text-slate-400 hover:text-white transition" exact-active-class="text-white" to="/">Home</router-link>
      <router-link class="text-slate-400 hover:text-white transition" active-class="text-white" to="/programs/a">Program A</router-link>
      <router-link class="text-slate-400 hover:text-white transition" active-class="text-white" to="/programs/b">Program B</router-link>
      <router-link class="text-slate-400 hover:text-white transition" active-class="text-white" to="/about">About</router-link>
      <router-link class="text-slate-400 hover:text-white transition" active-class="text-white" to="/faq">FAQ</router-link>
    </div>

    <!-- Auth -->
    <div class="flex items-center gap-3">
      <template v-if="!isLoggedIn">
        <router-link to="/auth/login" class="text-sm text-slate-400 hover:text-white transition px-4 py-1.5">Login</router-link>
        <router-link to="/auth/register" class="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition">Register</router-link>
      </template>
      <template v-else>
        <!-- Bell -->
        <div class="relative">
          <button @click="notifOpen = !notifOpen" class="relative text-slate-400 hover:text-white transition px-2">
            🔔
            <span v-if="unread > 0"
                  class="absolute -top-1 -right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {{ unread }}
            </span>
          </button>
          <div v-if="notifOpen" class="absolute right-0 mt-2 w-80 bg-gray-900 border border-blue-900 rounded-md shadow-lg z-50">
            <div class="flex justify-between items-center px-4 py-2 border-b border-blue-900">
              <span class="text-white text-sm font-semibold">Notifications</span>
              <button @click.stop="markAllRead" class="text-xs text-blue-400 hover:text-blue-300">Mark all read</button>
            </div>
            <div class="max-h-80 overflow-y-auto">
              <div v-if="notifications.length === 0" class="px-4 py-6 text-center text-gray-500 text-sm">No notifications</div>
              <div v-for="n in notifications" :key="n.id"
                   @click.stop="markRead(n)"
                   :class="['px-4 py-3 border-b border-blue-900/50 text-sm cursor-pointer hover:bg-blue-600/5', n.status === 'queued' ? 'bg-blue-600/10' : '']">
                <p :class="['', n.status === 'queued' ? 'text-white font-medium' : 'text-gray-400']">
                  {{ n.context ? JSON.parse(n.context).message ?? 'Notification' : 'Notification' }}
                </p>
                <p class="text-gray-500 text-xs mt-1">{{ new Date(n.created_at).toLocaleDateString() }}</p>
              </div>
            </div>
          </div>
        </div>

        <router-link to="/dashboard" class="text-sm text-slate-400 hover:text-white transition px-4 py-1.5" active-class="text-white">Dashboard</router-link>
        <button @click="logout" class="text-sm border border-slate-700 hover:border-red-900 text-slate-400 hover:text-red-400 px-4 py-1.5 rounded-lg transition">Logout</button>
      </template>
    </div>

  </nav>
</template>