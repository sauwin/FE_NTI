<script setup lang="ts">
  /**
   * Layout with footer and SEO for normal pages
   */
  import Navbar from '@/shared/components/Navbar.vue'
  import Footer from '@/shared/components/Footer.vue'
  import { useSeo } from '@/shared/seo/useSeo'

  useSeo()
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