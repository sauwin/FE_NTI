<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { forgotPassword } from '@/features/auth/api/auth'

const email = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const router = useRouter()

async function submit() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    await forgotPassword(email.value)
    success.value = 'Reset link sent to your email. Check your inbox.'
    email.value = ''
    setTimeout(() => router.push('/auth/login'), 3000)
  } catch (e: any) {
    if (e.response?.status === 403) {
      error.value = 'Admin passwords cannot be reset this way'
    } else if (e.response?.status === 422) {
      error.value = 'Email not found'
    } else {
      error.value = 'Error sending reset link. Try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <h1 class="font-bold text-4xl text-center p-4">Forgot Password</h1>
  <div class="flex justify-center">
    <form class="flex flex-col gap-2 mt-5 w-96" @submit.prevent="submit">
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <p v-if="success" class="text-green-500 text-sm">{{ success }}</p>

      <div>
        <label for="email" class="block text-white">Email</label>
        <input
            v-model="email"
            type="email"
            required
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-2" />
      </div>

      <input
          type="submit"
          :disabled="loading"
          :value="loading ? 'Sending...' : 'Send Reset Link'"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer text-white w-full h-10 mt-4 rounded" />

      <div class="text-center mt-4">
        <router-link class="text-blue-500 hover:text-blue-600" to="/auth/login">Back to Login</router-link>
      </div>
    </form>
  </div>
</template>