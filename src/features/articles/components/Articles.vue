<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getArticles, deleteArticle as deleteArticleApi } from '@/features/articles/api/articles'
import type { Article } from '@/features/articles/types/articles'
import { useAuthStore } from '@/features/auth/stores/auth'

const { t, locale } = useI18n() // Access the active language via locale
const router = useRouter()
const store = useAuthStore()

const rawArticles = ref<Article[] | null>(null)
const fetchSuccessfull = ref<boolean | null>(null)
const canEdit = store.isAdmin || store.isContentEditor

const articlesObj = computed(() => {
  if (!rawArticles.value) return []

  const currentLang = locale.value

  return rawArticles.value.map((article) => {
    const translation = 
      article.translations?.find(trans => trans.language === currentLang) ||
      article.translations?.find(trans => trans.language === 'en') ||
      article.translations?.[0]

    return {
      ...article,
      displayTitle: translation?.title || t('catalog.untitled'),
      displayExcerpt: translation?.excerpt || ''
    }
  })
})

async function fetchData() {
  try {
    const res = await getArticles()
    rawArticles.value = res.data.data
    fetchSuccessfull.value = true
  } catch(e: any) {
    fetchSuccessfull.value = false
  }
}

async function deleteArticle(id: string | number) {
  try {
    await deleteArticleApi(id)
    if (rawArticles.value) {
      rawArticles.value = rawArticles.value.filter(article => article.id != id)
    }
  } catch(e: any) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

    <button
      v-show="canEdit"
      @click="router.push('/article/create')"
      class="border-2 border-dashed border-slate-700 hover:border-blue-700 bg-slate-900/30 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition group min-h-80">
      <div class="text-5xl text-slate-600 group-hover:text-blue-600 transition select-none font-thin">+</div>
      <span class="text-xs font-semibold tracking-widest text-slate-600 group-hover:text-slate-400 transition uppercase">
        {{ t('catalog.newArticle') }}
      </span>
    </button>

    <div
      v-for="article in articlesObj.slice(0, canEdit ? 2 : 3)" :key="article.id"
      class="card-glowing flex flex-col overflow-hidden transition">

      <img
        :src="article.cover_image?.image_path ?? '/missing_image.png'"
        class="w-full h-56 object-cover" />

      <div class="flex flex-col flex-1 p-6">
        <h3 class="text-lg font-bold text-white mb-2 leading-snug">
          {{ article.displayTitle }}
        </h3>
        <p class="text-sm text-gray-400 leading-relaxed flex-1">
          {{ article.displayExcerpt }}
        </p>

        <div class="flex items-center gap-2 mt-6">
          <div class="text-blue-400" v-show="!canEdit">
            {{ t('catalog.published') }} {{ new Date(article.published_at).toLocaleDateString() }}
          </div>
          <button
            @click="deleteArticle(article.id)"
            v-show="canEdit"
            class="border border-red-800/60 hover:border-red-600 text-red-400/60 hover:text-red-400 px-4 py-1.5 rounded-lg text-sm font-medium transition">
            {{ t('catalog.delete') }}
          </button>
          <button
            @click="router.push(`/article/edit/${article.id}`)"
            v-show="canEdit"
            class="border border-yellow-700/60 hover:border-yellow-500 text-yellow-400/60 hover:text-yellow-400 px-4 py-1.5 rounded-lg text-sm font-medium transition">
            {{ t('catalog.edit') }}
          </button>
          <button
            @click="router.push(`/article/${article.id}`)"
            class="ml-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-1.5 rounded-lg text-sm font-medium transition">
            {{ canEdit ? t('catalog.preview') : t('catalog.readMore') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="fetchSuccessfull === false"
      class="border border-slate-800 rounded-2xl flex items-center justify-center py-16 col-span-3">
      <p class="text-sm text-slate-600">{{ t('catalog.failedLoad') }}</p>
    </div>

  </div>
</template>