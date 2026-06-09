<script setup lang="ts">
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const pillars = [
    {
      key: 'incubation',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2m0 14v2M5.636 5.636l1.414 1.414m9.9 9.9 1.414 1.414M3 12h2m14 0h2M5.636 18.364l1.414-1.414m9.9-9.9 1.414-1.414M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
      </svg>`,
    },
    {
      key: 'partnerships',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/>
      </svg>`,
    },
    {
      key: 'mentoring',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"/>
      </svg>`,
    },
    {
      key: 'retention',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
      </svg>`,
    },
  ]
</script>

<template>
  <section class="section-divider">
    <div class="section-label-light">{{ t('about.mission.label') }}</div>
    <h2 class="text-3xl font-semibold mb-4">{{ t('about.mission.title') }}</h2>
    <p class="text-gray-400 text-sm leading-relaxed max-w-2xl mb-10">{{ t('about.mission.intro') }}</p>

    <div class="flex flex-wrap lg:flex-nowrap gap-0 border border-slate-800 rounded-2xl overflow-hidden">
      <div
        v-for="pillar in pillars"
        :key="pillar.key"
        class="flex-1 min-w-52 p-8 border-r border-slate-800 last:border-r-0 hover:bg-blue-950/20 transition group"
      >
        <div class="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-900/50 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-900/60 transition" v-html="pillar.icon" />
        <h3 class="text-base font-semibold text-white mb-3">
          {{ t(`about.mission.pillars.${pillar.key}.title`) }}
        </h3>
        <p class="text-sm text-gray-500 leading-relaxed">
          {{ t(`about.mission.pillars.${pillar.key}.desc`) }}
        </p>
      </div>
    </div>
  </section>
</template>