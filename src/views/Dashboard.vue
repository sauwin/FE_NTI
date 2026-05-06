<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'

const router = useRouter()
const isAuthentified = ref(false)
const userObj = ref<User | null>(null)

type User = {
  email: string
  first_name?: string
  last_name?: string
  account_type?: string
  status?: string
}

async function fetchData() {
  try {
    const res = await api.get('/auth/me')
    userObj.value = res.data
    isAuthentified.value = true
  } catch {
    isAuthentified.value = false
  }
}

async function logout() {
  if (!isAuthentified.value) return
  try {
    await api.post('/auth/logout')
    localStorage.removeItem('token')
    router.push('/auth/login')
  } catch {
    alert('Unable to log out')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="px-20 py-16 pt-24">
    <div class="bg-blue-950 absolute rounded-full h-96 w-96 -z-10 -right-20 -top-10 blur-sm"></div>

    <!-- Not logged in -->
    <div v-if="!isAuthentified" class="flex flex-col items-center justify-center py-32 gap-4">
      <p class="text-gray-400 text-base">User is not logged in</p>
      <router-link to="/auth/login"
        class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
        Go to Login
      </router-link>
    </div>

    <!-- Logged in -->
    <div v-else>
      <!-- Header -->
      <div class="mb-12">
        <div class="inline-flex items-center bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-5">
          Dashboard
        </div>
        <h1 class="font-bold text-5xl leading-tight mb-3">
          Welcome, <span class="text-blue-400">{{ userObj?.first_name ?? userObj?.email }}</span>
        </h1>
        <div class="flex items-center gap-3 mt-2">
          <span class="text-sm text-gray-500">{{ userObj?.email }}</span>
          <span class="text-slate-700">·</span>
          <span class="text-xs capitalize bg-blue-600/15 border border-blue-800 text-blue-400 px-2.5 py-0.5 rounded-full">
            {{ userObj?.account_type ?? 'student' }}
          </span>
          <span class="text-slate-700">·</span>
          <span :class="[
            'text-xs px-2.5 py-0.5 rounded-full border',
            userObj?.status === 'active'
              ? 'bg-green-900/30 border-green-800 text-green-400'
              : 'bg-yellow-900/30 border-yellow-800 text-yellow-400'
          ]">
            {{ userObj?.status ?? 'pending' }}
          </span>
        </div>
      </div>

      <!-- Quick actions -->
      <section class="mb-16">
        <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-5">Quick actions</div>
        <div class="flex gap-4 flex-wrap">
          <router-link to="/programs/a/upload"
            class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition">
            Apply to Program A
          </router-link>
          <router-link to="/programs/b/upload"
            class="border border-slate-700 hover:border-blue-700 text-gray-400 hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition">
            Apply to Program B
          </router-link>
          <button
            @click="logout"
            class="border border-slate-700 hover:border-red-900 text-gray-400 hover:text-red-400 px-6 py-3 rounded-lg text-sm font-medium transition ml-auto">
            Log out
          </button>
        </div>
      </section>

      <!-- Applications -->
      <section>
        <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-5">My Applications</div>
        <div class="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
          <p class="text-slate-500 text-sm">No applications yet.</p>
          <p class="text-slate-600 text-xs mt-1">Submit your first application to get started.</p>
        </div>
      </section>
    </div>

  </div>
</template>