<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticleById } from '@/features/articles/api/articles'
import type { Article } from '@/features/articles/types/articles'
import { useAuthStore } from '@/features/auth/stores/auth'

const route = useRoute()
const router = useRouter()
const article = ref<Article | null>(null)
const loading = ref(true)
const error = ref('')
const store = useAuthStore()

const articleId = route.params.id as string

async function fetchArticle() {
  try {
    loading.value = true
    const res = await getArticleById(articleId)
    article.value = res.data.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load article'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchArticle()
})

// Get current language translation (default to English)
const currentTranslation = (lang: string = 'en') => {
  return article.value?.translations.find(t => t.language === lang)
}
</script>

<template>
  <div class="min-h-screen bg-slate-950">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="text-blue-400">Loading article...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <p class="text-red-400 mb-4">{{ error }}</p>
        <button @click="router.push('/')" class="text-blue-400 hover:text-blue-300">
          ← Back to Home
        </button>
      </div>
    </div>

    <!-- Article content -->
    <div v-else-if="article" class="max-w-4xl mx-auto px-6 py-12 bg-slate-700/15 rounded-2xl">
      <button @click="router.push('/')" class="text-blue-400 hover:text-blue-300 mb-8">
        ← Back to Home
      </button>

      <!-- Cover image -->
      <div v-if="article.cover_image" class="mb-8">
        <img :src="article.cover_image.image_path" :alt="currentTranslation()?.title" class="w-full h-64 md:h-96 object-cover rounded-lg" />
      </div>

      <!-- Article header -->
      <div class="mb-8">
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          {{ currentTranslation()?.title || 'Untitled Article' }}
        </h1>
        <p class="text-xl text-blue-300 font-medium mb-4">
          {{ currentTranslation()?.excerpt }}
        </p>
        <div class="text-sm text-gray-400">
          Published {{ new Date(article.published_at).toLocaleDateString() }}
        </div>
      </div>

      <!-- Article content -->
      <div class="prose prose-lg prose-invert max-w-none">
        <div v-html="currentTranslation()?.content" class="text-gray-300 leading-relaxed"></div>
      </div>

      <!-- Article footer -->
      <div class="mt-12 pt-8 border-t border-slate-800">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            Article ID: {{ article.id }}
          </div>
          <button @click="router.push('/')" class="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  </div>
</template>