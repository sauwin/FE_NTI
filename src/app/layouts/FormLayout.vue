<script setup lang="ts">
  /**
   * Simple layout without footer primarily for forms
   */
  import Navbar from '@/shared/components/Navbar.vue'
</script>

<template>
  <Navbar />

  <main class="flex-col items-center justify-center pt-16">
    <router-view />
  </main>
</template>