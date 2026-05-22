<script setup lang="ts">
  import Navbar from '@/shared/ui/Navbar.vue'
  import Footer from '@/shared/ui/Footer.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Navbar />

    <main class="flex-1 pb-16 pt-24">
      <router-view />
    </main>

    <Footer />
  </div>
</template>