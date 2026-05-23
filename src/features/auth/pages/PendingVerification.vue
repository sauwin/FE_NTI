<script setup lang="ts">
import { ref } from 'vue'
import api from '@/shared/api/axios'

const sent = ref(false)
const error = ref('')

async function resend() {
  try {
    await api.post('/email/resend')
    sent.value = true
  } catch {
    error.value = 'Could not resend. Try again later.'
  }
}
</script>

<template>
  <div class="flex flex-col items-center mt-20 gap-4">
    <h1 class="text-3xl font-bold">Check your email</h1>
    <p class="text-gray-600">We sent a verification link to your email address.</p>
    <p v-if="sent" class="text-green-600">Email resent!</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>
    <button @click="resend" class="bg-blue-700 text-white px-6 py-2 rounded">
      Resend verification email
    </button>
  </div>
</template>