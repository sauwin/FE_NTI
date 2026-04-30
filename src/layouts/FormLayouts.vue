<script setup lang="ts">
  import Navbar from '../components/Navbar.vue'
</script>

<template>
  <Navbar />

  <main class="flex-col items-center justify-center pt-16">
    <router-view />
  </main>
</template>