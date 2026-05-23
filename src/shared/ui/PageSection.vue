<script setup lang="ts">
interface Props {
  label?: string
  title: string
}

defineProps<Props>()
</script>

<template>
  <section class="section-divider">
    <div class="section-label-light">{{label}}</div>
    <h2 class="text-3xl font-semibold mb-10">{{title}}</h2>
    <slot />
  </section>
</template>