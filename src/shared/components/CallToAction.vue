<script setup lang="ts">
  import { useAuthStore } from '@/features/auth/stores/auth'
  import { useI18n } from 'vue-i18n'
  
  const auth = useAuthStore()
  const { t } = useI18n()
</script>

<template>
  <div v-if="auth.isLoggedIn" class="card-cta flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-5 sm:p-8">
    <div class="text-left">
      <h3 class="text-xl font-semibold text-white mb-1">{{ t('cta.logged_in.title') }}</h3>
      <p class="text-sm text-slate-400 sm:text-slate-500">{{ t('cta.logged_in.description') }}</p>
    </div>
    <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <router-link to="/programs/a"
        class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition text-sm text-center whitespace-nowrap w-full sm:w-auto">
        {{ t('cta.program_a') }}
      </router-link>
      <router-link to="/programs/b"
        class="border border-slate-700 hover:border-slate-500 text-gray-400 hover:text-gray-200 px-6 py-3 rounded-xl font-medium transition text-sm text-center whitespace-nowrap w-full sm:w-auto">
        {{ t('cta.program_b') }}
      </router-link>
    </div>
  </div>

  <div v-else class="card-cta flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 p-5 sm:p-8">
    <div class="text-left">
      <h3 class="text-xl font-semibold text-white mb-1">{{ t('cta.logged_out.title') }}</h3>
      <p class="text-sm text-slate-400 sm:text-slate-500">{{ t('cta.logged_out.description') }}</p>
    </div>
    <router-link to="/auth/register"
      class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition text-sm text-center whitespace-nowrap w-full sm:w-auto">
      {{ t('cta.logged_out.btn_register') }}
    </router-link>
  </div>
</template>