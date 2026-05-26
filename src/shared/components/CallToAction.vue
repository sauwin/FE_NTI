<script setup lang="ts">
  import { useAuthStore } from '@/features/auth/stores/auth'
  const auth = useAuthStore()
</script>

<template>
  <div v-if="auth.isLoggedIn" class="card-cta flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-5 sm:p-8">
    <div class="text-left">
      <h3 class="text-xl font-semibold text-white mb-1">Want to join?</h3>
      <p class="text-sm text-slate-400 sm:text-slate-500">Check out our programs and apply for the next open call</p>
    </div>
    <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <router-link to="/programs/a"
        class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition text-sm text-center whitespace-nowrap w-full sm:w-auto">
        Program A
      </router-link>
      <router-link to="/programs/b"
        class="border border-slate-700 hover:border-slate-500 text-gray-400 hover:text-gray-200 px-6 py-3 rounded-xl font-medium transition text-sm text-center whitespace-nowrap w-full sm:w-auto">
        Program B
      </router-link>
    </div>
  </div>

  <div v-else class="card-cta flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-5 sm:p-8">
    <div class="text-left">
      <h3 class="text-xl font-semibold text-white mb-1">Ready to start?</h3>
      <p class="text-sm text-slate-400 sm:text-slate-500">Create your account and apply for the next open call</p>
    </div>
    <router-link to="/auth/register"
      class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition text-sm text-center whitespace-nowrap w-full sm:w-auto">
      Create Account
    </router-link>
  </div>
</template>