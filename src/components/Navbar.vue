<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoggedIn = ref(false)

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('token')
})

function logout() {
  localStorage.removeItem('token')
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
      <router-link
        class="text-slate-400 hover:text-white transition"
        active-class="text-white"
        to="/">Home</router-link>
      <router-link
        class="text-slate-400 hover:text-white transition"
        active-class="text-white"
        to="/programs/a">Program A</router-link>
      <router-link
        class="text-slate-400 hover:text-white transition"
        active-class="text-white"
        to="/programs/b">Program B</router-link>
      <router-link
        class="text-slate-400 hover:text-white transition"
        active-class="text-white"
        to="/about">About</router-link>
      <router-link
        class="text-slate-400 hover:text-white transition"
        active-class="text-white"
        to="/faq">FAQ</router-link>
    </div>

    <!-- Auth -->
    <div class="flex items-center gap-3">
      <template v-if="!isLoggedIn">
        <router-link
          to="/auth/login"
          class="text-sm text-slate-400 hover:text-white transition px-4 py-1.5">
          Login
        </router-link>
        <router-link
          to="/auth/register"
          class="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition">
          Register
        </router-link>
      </template>
      <template v-else>
        <router-link
          to="/dashboard"
          class="text-sm text-slate-400 hover:text-white transition px-4 py-1.5"
          active-class="text-white">
          Dashboard
        </router-link>
        <button
          @click="logout"
          class="text-sm border border-slate-700 hover:border-red-900 text-slate-400 hover:text-red-400 px-4 py-1.5 rounded-lg transition">
          Logout
        </button>
      </template>
    </div>

  </nav>
</template>