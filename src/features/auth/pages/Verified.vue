<script setup>
  import { useAuthStore } from '@/features/auth/stores/auth'
  const auth = useAuthStore()
</script>

<template>
  <div class="flex flex-col items-center mt-20 gap-4">
    <h1 class="text-3xl font-bold text-green-600">Email verified!</h1>
    <p class="text-gray-400">Your email is verified. Please {{ auth.isStudent ? 'complete your profile' : 'wait till admin will approve your account' }}.</p>
    <router-link :to="auth.isStudent ? '/profile/complete' : '/'" class="bg-blue-700 text-white px-6 py-2 rounded">
      {{ auth.isStudent ? 'Complete Profile' : 'Go Home' }}
    </router-link>
  </div>
</template>
