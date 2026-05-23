<script setup lang="ts">
interface Props {
  badge?: string
  title: string
  highlight?: string
  description?: string
}

defineProps<Props>()
</script>

<template>
  <section class="section-divider">
    <div
      v-if="badge"
      class="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-6"
    >
      {{ badge }}
    </div>

    <h1 class="font-bold text-6xl leading-tight mb-7 max-w-3xl">
      {{ title }}
      <span v-if="highlight" class="text-blue-400">
        {{ highlight }}
      </span>
    </h1>

    <p
      v-if="description"
      class="text-gray-400 max-w-xl leading-relaxed text-base"
    >
      {{ description }}
    </p>

    <slot />
  </section>
</template>