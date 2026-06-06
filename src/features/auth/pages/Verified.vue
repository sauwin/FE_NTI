<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/features/auth/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
</script>

<template>
  <div class="flex flex-col items-center mt-20 gap-4">
    <h1 class="text-3xl font-bold text-green-600">{{ t('verified.title') }}</h1>
    <p class="text-gray-400">
      {{ t('verified.descPrefix') }}
      {{ auth.isStudent ? t('verified.completeProfile') : t('verified.waitApproval') }}.
    </p>
    <router-link :to="auth.isStudent ? '/profile' : '/'" class="bg-blue-700 text-white px-6 py-2 rounded">
      {{ auth.isStudent ? t('verified.btnComplete') : t('verified.btnHome') }}
    </router-link>
  </div>
</template>