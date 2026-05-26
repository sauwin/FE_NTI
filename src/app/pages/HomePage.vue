<script setup lang="ts">
  import PageHero from '@/shared/ui/PageHero.vue'
  import PageSection from '@/shared/ui/PageSection.vue'

  import Articles from '@/features/articles/components/Articles.vue'
  import CallToAction from '@/shared/components/CallToAction.vue'
</script>

<template>
  <div class="container-main relative overflow-hidden">
    
    <div class="hidden md:block bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>

    <PageHero
      badge="Nitrianský technologický inkubátor"
      title="Zanechaj svoju stopu v"
      highlight="technologickej budúcnosti"
      description="A prispej k rozvoju nitrianského regiónu"
    >
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 w-full sm:w-auto">
        <router-link to="/programs/a" class="btn-primary text-center">
          Explore Programs
        </router-link>
        <router-link to="/about" class="btn-secondary text-center">
          About NTI
        </router-link>
      </div>
    </PageHero>

    <PageSection label="Programs" title="Two paths, one goal">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div class="card-glowing p-6 sm:p-8">
          <div class="inline-block bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1 px-3 rounded-full mb-5">
            Program A
          </div>
          <h3 class="text-2xl font-bold mb-3">Grant Incubation</h3>
          <p class="text-gray-400 text-sm leading-relaxed mb-6">
            Have your own idea? Build a startup with NTI funding, expert mentoring, and full technical support.
          </p>
          <ul class="flex flex-col gap-2 mb-8">
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              Min. 3 team members
            </li>
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              Quarterly evaluation rounds
            </li>
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              6 required documents
            </li>
          </ul>
          <router-link to="/programs/a" class="btn-link">
            Learn more →
          </router-link>
        </div>

        <div class="card-glowing p-6 sm:p-8">
          <div class="inline-block bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1 px-3 rounded-full mb-5">
            Program B
          </div>
          <h3 class="text-2xl font-bold mb-3">Live Practice</h3>
          <p class="text-gray-400 text-sm leading-relaxed mb-6">
            Work on real projects from companies. Get paid, gain experience, and build your portfolio with actual clients.
          </p>
          <ul class="flex flex-col gap-2 mb-8">
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              Real company projects
            </li>
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              Financial compensation
            </li>
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              NTI mentor assigned
            </li>
          </ul>
          <router-link to="/programs/b" class="btn-link">
            Learn more →
          </router-link>
        </div>

      </div>
    </PageSection>

    <PageSection label="News" title="Articles">
      <Articles />
    </PageSection>

    <CallToAction />

  </div>
</template>