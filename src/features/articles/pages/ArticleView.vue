<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

const rawId = route.params.id
const articleId = Array.isArray(rawId) ? rawId[0] : rawId

async function fetchArticle() {
  if (!articleId) {
    error.value = 'Invalid article identifier'
    loading.value = false
    return
  }

  try {
    loading.value = true
    const res = await getArticleById(articleId)
    article.value = res.data.data
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load article'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchArticle()
})

// Dynamically extracts active localization contexts (defaults to English profile)
const translation = computed(() => {
  if (!article.value) return null
  
  // You can replace 'en' with your dynamic global locale state if needed (e.g., i18n.locale)
  const currentLang = 'en' 
  
  return article.value.translations.find(t => t.language === currentLang) || article.value.translations[0] || null
})

// Formatting runtime timestamp safely
const formattedDate = computed(() => {
  if (!article.value?.published_at) return ''
  return new Date(article.value.published_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
    
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-mono tracking-widest text-slate-500 uppercase">Loading article content...</p>
    </div>

    <div v-else-if="error" class="max-w-md w-full mx-auto bg-red-950/20 border border-red-900/40 rounded-2xl p-6 backdrop-blur-md text-center">
      <p class="text-xs font-mono text-red-400 mb-4">{{ error }}</p>
      <button type="button" @click="router.push('/')" class="inline-flex items-center text-xs font-bold text-blue-400 hover:text-blue-300 transition uppercase tracking-wider">
        ← Return to Catalog Index
      </button>
    </div>

    <div v-else-if="article" class="max-w-3xl w-full mx-auto bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 md:p-10 backdrop-blur-md shadow-2xl">
      
      <div class="mb-8 flex items-center justify-between">
        <button type="button" @click="router.push('/')" class="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1.5">
          ← Back to Catalog
        </button>
        <div class="text-[12px] font-mono tracking-wider text-slate-600 bg-slate-950 border border-slate-900 px-2.5 py-1 rounded">
          #{{ article.id }}
        </div>
      </div>

      <div v-if="article.cover_image" class="mb-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
        <img :src="article.cover_image.image_path" :alt="translation?.title" class="w-full h-64 md:h-[384px] object-cover hover:scale-[1.01] transition-transform duration-500" />
      </div>

      <div class="mb-8 border-b border-slate-800/60 pb-6">
        <h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3 leading-tight">
          {{ translation?.title || 'Untitled Resource Configuration' }}
        </h1>
        <p class="text-base md:text-lg text-blue-300/90 font-medium mb-4 leading-relaxed">
          {{ translation?.excerpt }}
        </p>
        <div class="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>Published at:</span>
          <time class="text-slate-400 font-semibold">{{ formattedDate }}</time>
        </div>
      </div>

      <article class="prose prose-invert prose-blue max-w-none text-slate-300 leading-relaxed text-sm md:text-base">
        <div v-html="translation?.content" class="focus:outline-none"></div>
      </article>

      <div class="mt-12 pt-6 border-t border-slate-800/60 flex items-center justify-end">
        <button type="button" @click="router.push('/')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-5 h-9 rounded-lg border border-slate-700 transition uppercase tracking-wide">
          Home page
        </button>
      </div>

    </div>
  </div>
</template>

<style>
.prose ul {
  list-style-type: disc !important;
  padding-left: 1.5rem !important;
  margin-top: 0.75rem !important;
  margin-bottom: 0.75rem !important;
}
.prose ol {
  list-style-type: decimal !important;
  padding-left: 1.5rem !important;
  margin-top: 0.75rem !important;
  margin-bottom: 0.75rem !important;
}
.prose li {
  margin-top: 0.25rem !important;
  margin-bottom: 0.25rem !important;
}
.prose p {
  margin-top: 1rem !important;
  margin-bottom: 1rem !important;
}
</style>