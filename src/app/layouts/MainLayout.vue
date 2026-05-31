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

    <main class="flex-1 px-4 sm:px-10 md:px-20 pb-12 mt-16 pt-20 md:pb-16 md:pt-24">
      <router-view />
    </main>

    <Footer />
  </div>
</template>