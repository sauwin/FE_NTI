<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col items-center mt-20 gap-4">
    <h1 class="text-3xl font-bold text-red-500">{{ t('accessDeniedPage.title') }}</h1>
    <p class="text-gray-400">{{ t('accessDeniedPage.description') }}</p>
    <router-link to="/dashboard" class="bg-blue-700 text-white px-6 py-2 rounded">{{ t('accessDeniedPage.btnDashboard') }}</router-link>
  </div>
</template>