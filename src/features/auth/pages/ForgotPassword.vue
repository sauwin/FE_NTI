<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { forgotPassword } from '@/features/auth/api/auth'

const { t } = useI18n()
const email = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const router = useRouter()

let redirectTimeout: ReturnType<typeof setTimeout> | null = null

async function submit() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    await forgotPassword(email.value.trim())
    success.value = t('forgotPassword.successMessage')
    email.value = ''
    redirectTimeout = setTimeout(() => router.push('/auth/login'), 3000)
  } catch (e: any) {
    if (e.response?.status === 403) {
      error.value = t('forgotPassword.errors.adminForbidden')
    } else if (e.response?.status === 422) {
      error.value = t('forgotPassword.errors.notFound')
    } else if (e.response?.status === 429) {
      error.value = t('forgotPassword.errors.tooManyRequests')
    } else {
      error.value = t('forgotPassword.errors.generic')
    }
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (redirectTimeout) {
    clearTimeout(redirectTimeout)
  }
})
</script>

<template>
  <h1 class="font-bold text-4xl text-center p-4 mt-20">{{ t('forgotPassword.title') }}</h1>
  <div class="flex justify-center">
    <form class="flex flex-col gap-2 mt-5 w-96" @submit.prevent="submit">
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <p v-if="success" class="text-green-500 text-sm">{{ success }}</p>

      <div>
        <label for="email" class="block text-white">{{ t('forgotPassword.emailLabel') }}</label>
        <input
            v-model="email"
            :disabled="loading"
            type="email"
            required
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-2" />
      </div>

      <input
          type="submit"
          :disabled="loading"
          :value="loading ? t('forgotPassword.btnSending') : t('forgotPassword.btnSend')"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer text-white w-full h-10 mt-4 rounded" />

      <div class="text-center mt-4">
        <router-link class="text-blue-500 hover:text-blue-600" to="/auth/login">{{ t('forgotPassword.backToLogin') }}</router-link>
      </div>
    </form>
  </div>
</template>