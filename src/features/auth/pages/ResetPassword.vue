<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { verifyResetToken, resetPassword } from '@/features/auth/api/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const tokenValid = ref(false)
const checkingToken = ref(true)

const token = ref(
  typeof route.query.token === 'string'
    ? route.query.token
    : ''
)

let redirectTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  if (!token.value) {
    error.value = t('resetPassword.errors.invalidLink')
    return
  }

  try {
    const res = await verifyResetToken(token.value)
    tokenValid.value = res.data.valid
    if (!tokenValid.value) {
      error.value = t('resetPassword.errors.expiredLink')
    }
  } catch {
    error.value = t('resetPassword.errors.verifyError')
  } finally {
    checkingToken.value = false
  }
})

async function submit() {
  error.value = ''
  success.value = ''

  if (password.value !== passwordConfirm.value) {
    error.value = t('resetPassword.errors.passwordsMismatch')
    return
  }

  loading.value = true

  try {
    await resetPassword({
      token: token.value,
      password: password.value,
      password_confirmation: passwordConfirm.value
    })
    success.value = t('resetPassword.success')
    redirectTimeout = setTimeout(() => router.push('/auth/login'), 2000)
  } catch (e: any) {
    if (e.response?.status === 400) {
      error.value = t('resetPassword.errors.expiredSubmission')
    } else if (e.response?.status == 429) {
      error.value = t('resetPassword.errors.tooManyRequests')
    } else {
      error.value = t('resetPassword.errors.generic')
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
  <h1 class="font-bold text-4xl text-center p-4 mt-20">{{ t('resetPassword.title') }}</h1>

  <div class="flex justify-center" v-if="checkingToken">
    <p class="text-white">{{ t('resetPassword.verifying') }}</p>
  </div>

  <div class="flex justify-center" v-else>
    <form v-if="tokenValid" class="flex flex-col gap-2 mt-5 w-96" @submit.prevent="submit">
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <p v-if="success" class="text-green-500 text-sm">{{ success }}</p>

      <div>
        <label for="password" class="block text-white">{{ t('resetPassword.newPassword') }}</label>
        <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-2" />
      </div>

      <div>
        <label for="passwordConfirm" class="block text-white">{{ t('resetPassword.confirmPassword') }}</label>
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
          :value="loading ? t('resetPassword.btnResetting') : t('resetPassword.btnReset')"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 cursor-pointer text-white w-full h-10 mt-4 rounded" />

      <div class="text-center mt-4">
        <router-link class="text-blue-500 hover:text-blue-600" to="/auth/login">{{ t('resetPassword.backToLogin') }}</router-link>
      </div>
    </form>

    <div class="flex justify-center" v-else>
      <div class="w-96 text-center">
        <p class="text-red-500 mb-4">{{ error || t('resetPassword.fallbackError') }}</p>
        <router-link class="text-blue-500 hover:text-blue-600" to="/auth/forgot-password">
          {{ t('resetPassword.requestNewLink') }}
        </router-link>
      </div>
    </div>
  </div>
</template>