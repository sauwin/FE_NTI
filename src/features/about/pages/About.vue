<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import PageHero from '@/shared/ui/PageHero.vue';
  import AboutMission from '../components/AboutMission.vue';
  import AboutOpportunities from '../components/AboutOpportunities.vue';
  import CallToAction from '@/shared/components/CallToAction.vue';

  const { t } = useI18n()
</script>

<template>
  <div class="hidden md:block bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>
  
  <PageHero
    :badge="t('about.hero.badge')"
    :title="t('about.hero.title')"
    :highlight="t('about.hero.highlight')"
    :description="t('about.hero.description')"
  />

  <AboutMission />

  <AboutOpportunities />

  <CallToAction />
</template>