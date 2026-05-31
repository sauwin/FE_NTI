<script setup lang="ts">
/**
 * Simple loading component
 */

withDefaults(
  defineProps<{
    /** Message shown under spinner */
    message?: string
    /** Whether fullscreen backdrop is displayed */
    backdrop?: boolean
  }>(),
  {
    message: 'Loading...',
    backdrop: true
  }
)
</script>

<template>
  <div 
    :class="[
      'flex flex-col items-center justify-center p-6 text-center',
      backdrop ? 'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50' : 'w-full my-8'
    ]"
  >
    <div class="w-10 h-10 border-2 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4"></div>

    <p class="text-sm uppercase font-mono tracking-widest text-blue-500 animate-pulse-slow">
      {{ message }}
    </p>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.animate-pulse-slow {
  animation: pulse 1.8s ease-in-out infinite;
}
</style>