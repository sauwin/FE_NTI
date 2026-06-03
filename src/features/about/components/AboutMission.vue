<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { missionItems } from '../data/mission'

  const { t, te } = useI18n()
</script>

<template>
  <section class="section-divider">
    <div class="section-label-light">{{ t('about.mission.label') }}</div>
    <h2 class="text-3xl font-semibold mb-10">{{ t('about.mission.title') }}</h2>
    <div class="flex flex-wrap lg:flex-nowrap gap-0 border border-slate-800 rounded-2xl overflow-hidden">
      <div v-for="item in missionItems" :key="item.title"
        class="flex-1 min-w-52 p-8 border-r border-slate-800 last:border-r-0 hover:bg-blue-950/20 transition">
        <!-- static fallback if i18n nested path doesn't explicitly match runtime item key -->
        <h3 class="text-base font-semibold text-white mb-3">
          {{ te(`about.mission.items.${item.title.toLowerCase()}.title`) ? t(`about.mission.items.${item.title.toLowerCase()}.title`) : item.title }}
        </h3>
        <p class="text-sm text-gray-500 leading-relaxed">
          {{ te(`about.mission.items.${item.title.toLowerCase()}.desc`) ? t(`about.mission.items.${item.title.toLowerCase()}.desc`) : item.desc }}
        </p>
      </div>
    </div>
  </section>
</template>