<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { resendVerificationEmail } from '@/features/auth/api/auth'

const { t } = useI18n()
const sent = ref(false)
const error = ref('')

async function resend() {
  try {
    await resendVerificationEmail()
    sent.value = true
  } catch {
    error.value = t('checkEmail.error')
  }
}
</script>

<template>
  <div class="flex flex-col items-center mt-20 gap-4">
    <h1 class="text-3xl font-bold">{{ t('checkEmail.title') }}</h1>
    <p class="text-gray-600">{{ t('checkEmail.description') }}</p>
    <p v-if="sent" class="text-green-600">{{ t('checkEmail.resent') }}</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>
    <button @click="resend" class="bg-blue-700 text-white px-6 py-2 rounded">
      {{ t('checkEmail.btnResend') }}
    </button>
  </div>
</template>