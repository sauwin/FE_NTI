<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../features/auth/stores/auth'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/shared/api/notifications'

const router = useRouter()
const auth = useAuthStore()
const isLoggedIn = ref(false)

const unread = ref(0)
const notifications = ref<any[]>([])
const notifOpen = ref(false)
const mobileOpen = ref(false)

onMounted(async () => {
  isLoggedIn.value = !!localStorage.getItem('token')
  if (isLoggedIn.value) {
    try {
      const res = await getNotifications()
      unread.value = res.data.unread_count
      notifications.value = res.data.notifications
    } catch {}
  }
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick() {
  notifOpen.value = false
  mobileOpen.value = false
}

async function markRead(n: any) {
  if (n.status === 'queued') {
    await markNotificationRead(n.id)
    n.status = 'sent'
    unread.value = Math.max(0, unread.value - 1)
  }
}

async function markAllRead() {
  await markAllNotificationsRead()
  unread.value = 0
  notifications.value = notifications.value.map(n => ({ ...n, status: 'sent' }))
}

function logout() {
  auth.logout()
  isLoggedIn.value = false
  mobileOpen.value = false
  router.push('/auth/login')
}

function notifMessage(n: any): string {
  try {
    return JSON.parse(n.context)?.message ?? 'Notification'
  } catch {
    return 'Notification'
  }
}
</script>

<template>
  <nav class="w-full h-14 flex justify-between items-center px-4 sm:px-6 md:px-10 fixed top-0 left-0 right-0 z-50 bg-[#080f1e]/90 backdrop-blur border-b border-slate-800 select-none">

    <router-link to="/" class="flex items-center gap-2 font-bold text-xl text-white flex-shrink-0 z-50">
      <img src="/logo.png" class="h-8 w-8" alt="Logo" />
      <span>NTI</span>
    </router-link>

    <div class="hidden md:flex items-center gap-6 lg:gap-8 text-sm">
      <router-link class="text-slate-400 hover:text-white transition" exact-active-class="text-white" to="/">Home</router-link>
      <router-link class="text-slate-400 hover:text-white transition" active-class="text-white" to="/programs/a">Program A</router-link>
      <router-link class="text-slate-400 hover:text-white transition" active-class="text-white" to="/programs/b">Program B</router-link>
      <router-link class="text-slate-400 hover:text-white transition" active-class="text-white" to="/about">About</router-link>
      <router-link class="text-slate-400 hover:text-white transition" active-class="text-white" to="/faq">FAQ</router-link>
    </div>

    <div class="hidden md:flex items-center gap-3">
      <template v-if="!isLoggedIn">
        <router-link to="/auth/login" class="text-sm text-slate-400 hover:text-white transition px-4 py-1.5">Login</router-link>
        <router-link to="/auth/register" class="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition">Register</router-link>
      </template>
      <template v-else>
        <div class="relative" @click.stop>
          <button @click="notifOpen = !notifOpen" class="relative text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-slate-800/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span v-if="unread > 0"
              class="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
              {{ unread > 9 ? '9+' : unread }}
            </span>
          </button>

          <div v-if="notifOpen" class="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div class="flex justify-between items-center px-4 py-3 border-b border-slate-800 bg-slate-900/50">
              <span class="text-white text-sm font-semibold">Notifications</span>
              <button @click.stop="markAllRead" class="text-xs text-blue-400 hover:text-blue-300 transition">Mark all read</button>
            </div>
            <div class="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
              <div v-if="notifications.length === 0" class="px-4 py-6 text-center text-slate-500 text-sm italic">No notifications</div>
              <div
                v-for="n in notifications" :key="n.id"
                @click.stop="markRead(n)"
                :class="['px-4 py-3 text-sm cursor-pointer hover:bg-slate-800/40 transition', n.status === 'queued' ? 'bg-blue-600/5' : '']"
              >
                <div class="flex items-start gap-2.5">
                  <span :class="['mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0', n.status === 'queued' ? 'bg-blue-400' : 'bg-slate-700']"></span>
                  <div class="flex-1 min-w-0">
                    <p :class="['leading-snug break-words', n.status === 'queued' ? 'text-white font-medium' : 'text-slate-400']">
                      {{ notifMessage(n) }}
                    </p>
                    <p class="text-slate-500 text-xs mt-1">{{ new Date(n.created_at).toLocaleDateString() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <router-link to="/dashboard" class="text-sm text-slate-400 hover:text-white transition px-3 py-1.5" active-class="text-white">Dashboard</router-link>
        <button @click="logout" class="text-sm border border-slate-800 hover:border-red-900/50 text-slate-400 hover:text-red-400 px-4 py-1.5 rounded-lg transition">Logout</button>
      </template>
    </div>

    <div class="flex md:hidden items-center gap-1 z-50">
      <template v-if="isLoggedIn">
        <div class="relative" @click.stop>
          <button @click="notifOpen = !notifOpen; mobileOpen = false" class="relative text-slate-400 hover:text-white transition p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span v-if="unread > 0"
              class="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {{ unread > 9 ? '9+' : unread }}
            </span>
          </button>

          <div 
            v-if="notifOpen" 
            class="fixed top-16 right-4 left-4 max-w-sm sm:left-auto sm:w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div class="flex justify-between items-center px-4 py-3 border-b border-slate-800 bg-slate-900/50">
              <span class="text-white text-sm font-semibold">Notifications</span>
              <button @click.stop="markAllRead" class="text-xs text-blue-400 hover:text-blue-300">Mark all read</button>
            </div>
            <div class="max-h-60 overflow-y-auto divide-y divide-slate-800/50">
              <div v-if="notifications.length === 0" class="px-4 py-6 text-center text-slate-500 text-sm italic">No notifications</div>
              <div
                v-for="n in notifications" :key="n.id"
                @click.stop="markRead(n)"
                :class="['px-4 py-3 text-sm cursor-pointer hover:bg-slate-800/40 transition', n.status === 'queued' ? 'bg-blue-600/5' : '']"
              >
                <div class="flex items-start gap-2.5">
                  <span :class="['mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0', n.status === 'queued' ? 'bg-blue-400' : 'bg-slate-700']"></span>
                  <div class="flex-1 min-w-0">
                    <p :class="['leading-snug break-words', n.status === 'queued' ? 'text-white font-medium' : 'text-slate-400']">
                      {{ notifMessage(n) }}
                    </p>
                    <p class="text-slate-500 text-xs mt-1">{{ new Date(n.created_at).toLocaleDateString() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <button
        @click.stop="mobileOpen = !mobileOpen; notifOpen = false"
        class="text-slate-400 hover:text-white transition p-2 rounded-full"
        aria-label="Menu"
      >
        <svg v-if="!mobileOpen" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div
      v-if="mobileOpen"
      @click.stop
      class="fixed top-0 left-0 w-full h-screen bg-[#080f1e]/95 backdrop-blur-lg border-b border-slate-800 z-40 flex flex-col pt-20 pb-6 px-6 gap-1 md:hidden overflow-y-auto"
    >
      <router-link @click="mobileOpen = false" class="text-slate-400 hover:text-white transition py-3.5 text-base font-medium border-b border-slate-800/60" to="/">Home</router-link>
      <router-link @click="mobileOpen = false" class="text-slate-400 hover:text-white transition py-3.5 text-base font-medium border-b border-slate-800/60" to="/programs/a">Program A</router-link>
      <router-link @click="mobileOpen = false" class="text-slate-400 hover:text-white transition py-3.5 text-base font-medium border-b border-slate-800/60" to="/programs/b">Program B</router-link>
      <router-link @click="mobileOpen = false" class="text-slate-400 hover:text-white transition py-3.5 text-base font-medium border-b border-slate-800/60" to="/about">About</router-link>
      <router-link @click="mobileOpen = false" class="text-slate-400 hover:text-white transition py-3.5 text-base font-medium border-b border-slate-800/60" to="/faq">FAQ</router-link>

      <div class="pt-6 flex flex-col gap-3">
        <template v-if="!isLoggedIn">
          <router-link @click="mobileOpen = false" to="/auth/login"
            class="text-sm font-medium text-slate-300 hover:text-white transition py-3 text-center border border-slate-800 rounded-xl bg-slate-900/40">
            Login
          </router-link>
          <router-link @click="mobileOpen = false" to="/auth/register"
            class="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white py-3 text-center rounded-xl transition shadow-lg shadow-blue-600/10">
            Register
          </router-link>
        </template>
        <template v-else>
          <router-link @click="mobileOpen = false" to="/dashboard"
            class="text-sm font-medium text-slate-300 hover:text-white transition py-3 text-center border border-slate-800 rounded-xl bg-slate-900/40">
            Dashboard
          </router-link>
          <button @click="logout"
            class="text-sm font-medium border border-slate-800 hover:border-red-950 text-slate-400 hover:text-red-400 py-3 rounded-xl transition">
            Logout
          </button>
        </template>
      </div>
    </div>

  </nav>
</template>