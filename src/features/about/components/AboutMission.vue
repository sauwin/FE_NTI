<script setup lang="ts">
  import { missionItems } from '../data/mission'
</script>

<template>
  <section class="section-divider">
    <div class="section-label-light">Mission</div>
    <h2 class="text-3xl font-semibold mb-10">What we do</h2>
    <div class="flex flex-wrap lg:flex-nowrap gap-0 border border-slate-800 rounded-2xl overflow-hidden">
      <div v-for="item in missionItems" :key="item.title"
        class="flex-1 min-w-52 p-8 border-r border-slate-800 last:border-r-0 hover:bg-blue-950/20 transition">
        <h3 class="text-base font-semibold text-white mb-3">{{ item.title }}</h3>
        <p class="text-sm text-gray-500 leading-relaxed">{{ item.desc }}</p>
      </div>
    </div>
  </section>
</template>