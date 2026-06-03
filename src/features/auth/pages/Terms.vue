<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <div class="bg-blue-950 absolute rounded-full h-96 w-96 -z-10 -right-20 -top-10"></div>
  <div class="max-w-3xl mx-auto py-20">
    <div class="mb-10">
      <div class="inline-flex items-center bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-5">{{ t('terms.tag') }}</div>
      <h1 class="text-4xl font-bold text-white mb-4">{{ t('terms.title') }}</h1>
      <p class="text-gray-400">{{ t('terms.subtitle') }}</p>
    </div>
    <div class="space-y-6 text-slate-400 text-sm leading-relaxed">
      <p>{{ t('terms.p1') }}</p>
      <p>{{ t('terms.p2') }}</p>
      <p>{{ t('terms.p3') }}</p>
    </div>
  </div>
</template>