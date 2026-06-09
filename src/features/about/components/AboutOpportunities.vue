<script setup lang="ts">
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  function asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  }
</script>

<template>
  <section class="section-divider">
    <div class="section-label-light">{{ t('about.opportunities.label') }}</div>
    <h2 class="text-3xl font-semibold mb-4">{{ t('about.opportunities.title') }}</h2>
    <p class="text-gray-400 text-sm leading-relaxed max-w-2xl mb-10">{{ t('about.opportunities.intro') }}</p>

    <!-- Program cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

      <!-- Program A -->
      <div class="border border-slate-800 bg-slate-900/50 rounded-2xl p-8 flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono font-semibold text-blue-400 border border-blue-900 bg-blue-950/50 px-2.5 py-1 rounded-full uppercase tracking-widest">
            {{ t('about.opportunities.programA.badge') }}
          </span>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-white mb-2">{{ t('about.opportunities.programA.title') }}</h3>
          <p class="text-sm text-gray-400 leading-relaxed">{{ t('about.opportunities.programA.desc') }}</p>
        </div>
        <ul class="space-y-2">
          <li
            v-for="point in asStringArray(t('about.opportunities.programA.points', { returnObjects: true }))"
            :key="point"
            class="flex items-start gap-2 text-sm text-gray-400"
          >
            <span class="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            {{ point }}
          </li>
        </ul>
      </div>

      <!-- Program B -->
      <div class="border border-slate-800 bg-slate-900/50 rounded-2xl p-8 flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono font-semibold text-indigo-400 border border-indigo-900 bg-indigo-950/50 px-2.5 py-1 rounded-full uppercase tracking-widest">
            {{ t('about.opportunities.programB.badge') }}
          </span>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-white mb-2">{{ t('about.opportunities.programB.title') }}</h3>
          <p class="text-sm text-gray-400 leading-relaxed">{{ t('about.opportunities.programB.desc') }}</p>
        </div>
        <ul class="space-y-2">
          <li
            v-for="point in asStringArray(t('about.opportunities.programB.points', { returnObjects: true }))"
            :key="point"
            class="flex items-start gap-2 text-sm text-gray-400"
          >
            <span class="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
            {{ point }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Who is NTI for -->
    <div class="border border-slate-800 rounded-2xl overflow-hidden">
      <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
        <div class="p-8">
          <div class="section-label-light mb-4">{{ t('about.opportunities.forStudents.label') }}</div>
          <h3 class="text-base font-semibold text-white mb-3">{{ t('about.opportunities.forStudents.title') }}</h3>
          <p class="text-sm text-gray-400 leading-relaxed">{{ t('about.opportunities.forStudents.desc') }}</p>
        </div>
        <div class="p-8">
          <div class="section-label-light mb-4">{{ t('about.opportunities.forCompanies.label') }}</div>
          <h3 class="text-base font-semibold text-white mb-3">{{ t('about.opportunities.forCompanies.title') }}</h3>
          <p class="text-sm text-gray-400 leading-relaxed">{{ t('about.opportunities.forCompanies.desc') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>