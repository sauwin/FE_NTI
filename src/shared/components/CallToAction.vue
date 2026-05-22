<script setup lang="ts">
  import { useAuthStore } from '@/features/auth/stores/auth'
  const auth = useAuthStore()
</script>

<template>
  <div v-if="auth.isLoggedIn" class="card-cta">
    <div>
      <h3 class="text-xl font-semibold text-white mb-1">Want to join?</h3>
      <p class="text-sm text-slate-500">Check out our programs and apply for the next open call</p>
    </div>
    <div class="flex gap-3">
      <router-link to="/programs/a"
        class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition text-sm whitespace-nowrap">
        Program A
      </router-link>
      <router-link to="/programs/b"
        class="border border-slate-700 hover:border-slate-500 text-gray-400 hover:text-gray-200 px-6 py-3 rounded-lg font-medium transition text-sm whitespace-nowrap">
        Program B
      </router-link>
    </div>
  </div>

  <div v-else class="card-cta">
    <div>
      <h3 class="text-xl font-semibold text-white mb-1">Ready to start?</h3>
      <p class="text-sm text-slate-500">Create your account and apply for the next open call</p>
    </div>
    <router-link to="/auth/register"
      class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium transition text-sm whitespace-nowrap">
      Create Account
    </router-link>
  </div>
</template>