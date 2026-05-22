<script setup lang="ts">
import Articles from '../components/Articles.vue'
</script>

<template>
  <div class="container-main">
    <div class="bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10 blur-sm"></div>
    <div class="bg-blue-950/30 absolute rounded-full h-64 w-64 -z-10 right-40 top-60 blur-lg"></div>

    <div class="bg-surface">
      Test div
    </div>

    <!-- HERO -->
    <div class="section-divider">
      <div class="inline-flex items-center bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-6">
        Nitrianský technologický inkubátor
      </div>
      <h1 class="font-bold text-6xl leading-tight mb-5">
        Zanechaj svoju stopu<br>
        v <span class="text-blue-400">technologickej budúcnosti</span>
      </h1>
      <p class="text-blue-300 font-semibold text-xl mb-10">
        Nitrianského regiónu
      </p>
      <div class="flex gap-4">
        <router-link to="/programs/a"
          class="btn-primary">
          Explore Programs
        </router-link>
        <router-link to="/about"
          class="btn-secondary">
          About NTI
        </router-link>
      </div>
    </div>

    <!-- PROGRAMS -->
    <section class="section-divider">
      <div class="section-label-light">Programs</div>
      <h2 class="text-3xl font-semibold mb-10">Two paths, one goal</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card-program">
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
          <router-link to="/programs/a"
            class="btn-link">
            Learn more →
          </router-link>
        </div>

        <div class="card-program">
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
          <router-link to="/programs/b"
            class="btn-link">
            Learn more →
          </router-link>
        </div>
      </div>
    </section>

    <!-- ARTICLES -->
    <section class="section-divider">
      <div class="section-label-light">News</div>
      <h2 class="text-3xl font-semibold mb-10">Články</h2>
      <Articles />
    </section>

    <!-- CTA -->
    <div class="card-cta">
      <div>
        <h3 class="text-xl font-semibold text-white mb-1">Ready to start?</h3>
        <p class="text-sm text-slate-500">Create your account and apply for the next open call</p>
      </div>
      <router-link to="/auth/register"
        class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium transition text-sm whitespace-nowrap">
        Create Account
      </router-link>
    </div>

  </div>
</template>