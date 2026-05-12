<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'

const router = useRouter()
const isAuthentified = ref(false)
const userObj = ref<User | null>(null)
const onboardingCompleted = ref(true)

type User = {
  email: string
  first_name?: string
  last_name?: string
  role_slug?: string
  status?: string
}

async function fetchData() {
  try {
    const res = await api.get('/auth/me')
    userObj.value = res.data
    isAuthentified.value = true

    if (res.data.role_slug === 'student') {
      const ob = await api.get('/onboarding/status')
      onboardingCompleted.value = ob.data.completed
    }
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
    <div class="bg-blue-950 absolute rounded-full h-96 w-96 -z-10 -right-20 -top-10"></div>

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
      <div class="mb-10">
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
            {{ userObj?.role_slug ?? '—' }}
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

      <!-- Onboarding banner -->
      <div v-if="userObj?.role_slug === 'student' && !onboardingCompleted"
        class="border border-yellow-800/50 bg-yellow-900/10 rounded-xl px-6 py-4 flex items-center justify-between gap-4 mb-10">
        <div>
          <div class="text-sm font-semibold text-yellow-400 mb-1">Complete your profile</div>
          <div class="text-xs text-slate-500">Fill in your student profile before submitting an application</div>
        </div>
        <router-link to="/onboarding"
          class="bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap">
          Complete now
        </router-link>
      </div>

      <!-- STUDENT dashboard -->
      <div v-if="userObj?.role_slug === 'student'">

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
            <router-link to="/profile"
              class="border border-slate-700 hover:border-blue-700 text-gray-400 hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition">
              My Profile
            </router-link>
            <button @click="logout"
              class="border border-slate-700 hover:border-red-900 text-gray-400 hover:text-red-400 px-6 py-3 rounded-lg text-sm font-medium transition ml-auto">
              Log out
            </button>
          </div>
        </section>

        <section>
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-5">My Applications</div>
          <div class="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
            <p class="text-slate-500 text-sm">No applications yet.</p>
            <p class="text-slate-600 text-xs mt-1">Submit your first application to get started.</p>
          </div>
        </section>

      </div>

      <!-- MENTOR dashboard -->
      <div v-else-if="userObj?.role_slug === 'mentor'">

        <section class="mb-16">
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-5">Quick actions</div>
          <div class="flex gap-4 flex-wrap">
            <button @click="logout"
              class="border border-slate-700 hover:border-red-900 text-gray-400 hover:text-red-400 px-6 py-3 rounded-lg text-sm font-medium transition ml-auto">
              Log out
            </button>
          </div>
        </section>

        <section>
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-5">My Projects</div>
          <div class="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
            <p class="text-slate-500 text-sm">No projects assigned yet.</p>
          </div>
        </section>

      </div>

      <!-- COMPANY dashboard -->
      <div v-else-if="userObj?.role_slug === 'company'">

        <section class="mb-16">
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-5">Quick actions</div>
          <div class="flex gap-4 flex-wrap">
            <router-link to="/programs/b/upload"
              class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition">
              Submit Project Task
            </router-link>
            <button @click="logout"
              class="border border-slate-700 hover:border-red-900 text-gray-400 hover:text-red-400 px-6 py-3 rounded-lg text-sm font-medium transition ml-auto">
              Log out
            </button>
          </div>
        </section>

        <section>
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-5">My Tasks</div>
          <div class="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
            <p class="text-slate-500 text-sm">No tasks submitted yet.</p>
          </div>
        </section>

      </div>

      <!-- ADMIN dashboard -->
      <div v-else-if="userObj?.role_slug === 'nti_admin' || userObj?.role_slug === 'super_admin'">

        <section class="mb-16">
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-5">Quick actions</div>
          <div class="flex gap-4 flex-wrap">
            <button @click="logout"
              class="border border-slate-700 hover:border-red-900 text-gray-400 hover:text-red-400 px-6 py-3 rounded-lg text-sm font-medium transition ml-auto">
              Log out
            </button>
          </div>
        </section>

        <section>
          <div class="text-xs font-semibold tracking-widest uppercase text-blue-500 mb-5">Overview</div>
          <div class="grid grid-cols-3 gap-4">
            <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/30">
              <div class="text-xs text-slate-500 mb-1">Applications</div>
              <div class="text-2xl font-bold text-white">—</div>
            </div>
            <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/30">
              <div class="text-xs text-slate-500 mb-1">Active Projects</div>
              <div class="text-2xl font-bold text-white">—</div>
            </div>
            <div class="border border-slate-800 rounded-2xl p-6 bg-slate-900/30">
              <div class="text-xs text-slate-500 mb-1">Open Calls</div>
              <div class="text-2xl font-bold text-white">—</div>
            </div>
          </div>
        </section>

      </div>

      <!-- Fallback for unknown role -->
      <div v-else>
        <div class="flex gap-4">
          <button @click="logout"
            class="border border-slate-700 hover:border-red-900 text-gray-400 hover:text-red-400 px-6 py-3 rounded-lg text-sm font-medium transition">
            Log out
          </button>
        </div>
      </div>

    </div>
  </div>
</template>