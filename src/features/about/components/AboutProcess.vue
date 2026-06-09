<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const steps = ['register', 'apply', 'evaluate', 'onboard', 'build', 'graduate']
</script>

<template>
  <section class="section-divider">
    <div class="section-label-light">{{ t('about.process.label') }}</div>
    <h2 class="text-3xl font-semibold mb-4">{{ t('about.process.title') }}</h2>
    <p class="text-gray-400 text-sm leading-relaxed max-w-2xl mb-10">{{ t('about.process.intro') }}</p>

    <div class="relative">
      <!-- connecting line desktop -->
      <div class="hidden lg:block absolute top-6 left-0 right-0 h-px bg-slate-800 z-0 mx-[calc(100%/12)]" />

      <div class="grid grid-cols-2 lg:grid-cols-6 gap-4 relative z-10">
        <div
          v-for="(step, idx) in steps"
          :key="step"
          class="flex flex-col items-center text-center gap-3"
        >
          <div class="w-12 h-12 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-sm font-mono font-semibold text-blue-400 flex-shrink-0">
            {{ String(idx + 1).padStart(2, '0') }}
          </div>
          <div>
            <div class="text-sm font-semibold text-white">{{ t(`about.process.steps.${step}.title`) }}</div>
            <div class="text-xs text-gray-500 mt-1 leading-relaxed">{{ t(`about.process.steps.${step}.desc`) }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>