<script setup lang="ts">
  import PageHero from '@/shared/ui/PageHero.vue';
  import AboutMission from '../components/AboutMission.vue';
  import AboutOpportunities from '../components/AboutOpportunities.vue';
  import CallToAction from '@/shared/components/CallToAction.vue';
</script>

<template>
  <div class="container-main">
    <div class="hidden md:block bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>

    <PageHero
      badge="About"
      title="About"
      highlight="NTI"
      description="
        Nitrianský technologický inkubátor is a student-focused innovation platform at UKF Nitra.
        We help students turn ideas into products and connect them with real companies.
      "
    />

    <AboutMission />

    <AboutOpportunities />

    <CallToAction />

  </div>
</template>