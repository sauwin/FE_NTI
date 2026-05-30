<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getPageBySlug } from '@/features/pages/api/pages'
import type { Page } from '@/features/pages/types/pages'

const route = useRoute()
const page = ref<Page | null>(null)
const error = ref(false)
const loading = ref(true)

const lang = 'sk'

const translation = () =>
    page.value?.translations.find(t => t.language === lang) ??
    page.value?.translations[0]

async function load(slug: string) {
  loading.value = true
  error.value = false
  try {
    const res = await getPageBySlug(slug)
    page.value = res.data.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
  load(slug)
})

watch(() => route.params.slug, (slug) => {
  const s = Array.isArray(slug) ? slug[0] : slug
  load(s)
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-12">
    <div v-if="loading" class="text-slate-400 text-sm">Loading...</div>
    <div v-else-if="error" class="text-red-400 text-sm">Page not found.</div>
    <template v-else-if="page && translation()">
      <h1 class="text-3xl font-bold text-white mb-6">{{ translation()?.title }}</h1>
      <div class="prose prose-invert max-w-none text-slate-300" v-html="translation()?.content" />
    </template>
  </div>
</template>