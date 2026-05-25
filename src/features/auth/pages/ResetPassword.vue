<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { verifyResetToken, resetPassword } from '@/features/auth/api/auth'

const route = useRoute()
const router = useRouter()
const token = ref(route.query.token as string || '')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const tokenValid = ref(false)
const checkingToken = ref(true)

onMounted(async () => {
  if (!token.value) {
    error.value = 'Invalid reset link'
    return
  }

  try {
    const res = await verifyResetToken(token.value)
    tokenValid.value = res.data.valid
    if (!tokenValid.value) {
      error.value = 'Reset link expired or invalid'
    }
  } catch {
    error.value = 'Error verifying link'
  } finally {
    checkingToken.value = false
  }
})

async function submit() {
  error.value = ''
  success.value = ''

  if (password.value !== passwordConfirm.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }

  loading.value = true

  try {
    await resetPassword({
      token: token.value,
      password: password.value,
      password_confirmation: passwordConfirm.value
    })
    success.value = 'Password reset successfully. Redirecting to login...'
    setTimeout(() => router.push('/auth/login'), 2000)
  } catch (e: any) {
    if (e.response?.status === 400) {
      error.value = 'Reset link expired. Request a new one.'
    } else {
      error.value = 'Error resetting password. Try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <h1 class="font-bold text-4xl text-center p-4">Reset Password</h1>

  <div v-if="checkingToken" class="flex justify-center">
    <p class="text-white">Verifying reset link...</p>
  </div>

  <div v-else class="flex justify-center">
    <form v-if="tokenValid" class="flex flex-col gap-2 mt-5 w-96" @submit.prevent="submit">
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <p v-if="success" class="text-green-500 text-sm">{{ success }}</p>

      <div>
        <label for="password" class="block text-white">New Password</label>
        <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-2" />
      </div>

      <div>
        <label for="passwordConfirm" class="block text-white">Confirm Password</label>
        <input
            v-model="passwordConfirm"
            type="password"
            required
            minlength="8"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-2" />
      </div>

      <input
          type="submit"
          :disabled="loading"
          :value="loading ? 'Resetting...' : 'Reset Password'"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer text-white w-full h-10 mt-4 rounded" />

      <div class="text-center mt-4">
        <router-link class="text-blue-500 hover:text-blue-600" to="/auth/login">Back to Login</router-link>
      </div>
    </form>

    <div v-else class="flex justify-center">
      <div class="w-96 text-center">
        <p class="text-red-500 mb-4">{{ error || 'Invalid or expired reset link' }}</p>
        <router-link class="text-blue-500 hover:text-blue-600" to="/auth/forgot-password">
          Request a new reset link
        </router-link>
      </div>
    </div>
  </div>
</template>