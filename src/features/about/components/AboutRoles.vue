<script setup lang="ts">
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const roles = ['student', 'company', 'mentor']

  function asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  }
</script>

<template>
  <section class="section-divider">
    <div class="section-label-light">{{ t('about.roles.label') }}</div>
    <h2 class="text-3xl font-semibold mb-4">{{ t('about.roles.title') }}</h2>
    <p class="text-gray-400 text-sm leading-relaxed max-w-2xl mb-10">{{ t('about.roles.intro') }}</p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="role in roles"
        :key="role"
        class="border border-slate-800 bg-slate-900/50 rounded-2xl p-8 hover:bg-blue-950/10 hover:border-slate-700 transition"
      >
        <div class="text-xs font-mono font-semibold text-slate-500 uppercase tracking-widest mb-4">
          {{ t(`about.roles.items.${role}.label`) }}
        </div>
        <h3 class="text-base font-semibold text-white mb-3">{{ t(`about.roles.items.${role}.title`) }}</h3>
        <p class="text-sm text-gray-400 leading-relaxed mb-5">{{ t(`about.roles.items.${role}.desc`) }}</p>
        <ul class="space-y-2">
          <li
            v-for="perk in asStringArray(t(`about.roles.items.${role}.perks`, { returnObjects: true }))"
            :key="perk"
            class="flex items-start gap-2 text-xs text-gray-500"
          >
            <span class="mt-1.5 w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
            {{ perk }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>