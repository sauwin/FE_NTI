<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
</script>

<template>
  <section class="section-divider">
    <div class="section-label-light">{{ t('about.opportunities.label') }}</div>
    <h2 class="text-3xl font-semibold mb-10">{{ t('about.opportunities.title') }}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="border border-slate-800 bg-slate-900/50 rounded-2xl p-8">
        <h3 class="text-lg font-semibold text-white mb-3">{{ t('about.opportunities.students_title') }}</h3>
        <p class="text-sm text-gray-400 leading-relaxed">
          {{ t('about.opportunities.students_desc') }}
        </p>
      </div>
      <div class="border border-slate-800 bg-slate-900/50 rounded-2xl p-8">
        <h3 class="text-lg font-semibold text-white mb-3">{{ t('about.opportunities.companies_title') }}</h3>
        <p class="text-sm text-gray-400 leading-relaxed">
          {{ t('about.opportunities.companies_desc') }}
        </p>
      </div>
    </div>
  </section>
</template>