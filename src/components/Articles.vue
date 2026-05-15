<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const store = useAuthStore()
const articlesObj = ref<Article[] | null>(null)
const fetchSuccessfull = ref<boolean | null>(null)

type Translation = {
  id: number
  article_id: number
  language: string
  title: string
  excerpt: string
  content: string
  created_at: string
  updated_at: string
}

type Article = {
  id: number
  slug: string
  author_id: number
  is_published: boolean
  published_at: string
  created_at: string
  updated_at: string
  translations: Translation[]
  cover_image?: Image
}

type Image = {
  image_path: string
}

type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

type ArticlesResponse = {
  data: Article[]
  meta: PaginationMeta
}

async function fetchData() {
  try {
    const res = await api.get('/articles')
    articlesObj.value = res.data.data
    fetchSuccessfull.value = true
  } catch(e: any) {
    fetchSuccessfull.value = false
  }
}

async function deleteArticle(id: Number) {
  try {
    await api.delete('/articles/' + id)
    articlesObj.value = articlesObj.value?.filter(article => article.id != id) ?? []
    console.log('Article deleted successfully')
  } catch(e: any) {
    console.warn('Error during deletion of article')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

    <!-- Add new article -->
    <button
      @click="router.push('/article/create')"
      class="border-2 border-dashed border-slate-700 hover:border-blue-700 bg-slate-900/30 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition group min-h-80">
      <div class="text-5xl text-slate-600 group-hover:text-blue-600 transition select-none font-thin">+</div>
      <span class="text-xs font-semibold tracking-widest text-slate-600 group-hover:text-slate-400 transition uppercase">New article</span>
    </button>

    <!-- Article cards -->
    <div
      v-for="article in articlesObj?.slice(0, 2)" :key="article.id"
      class="border-2 border-blue-800 hover:border-blue-600 bg-slate-900/50 rounded-2xl flex flex-col overflow-hidden transition">

      <!-- Image — taller -->
      <img
        :src="article.cover_image?.image_path ?? '/missing_image.png'"
        class="w-full h-56 object-cover" />

      <!-- Content -->
      <div class="flex flex-col flex-1 p-6">
        <h3 class="text-lg font-bold text-white mb-2 leading-snug">
          {{ article.translations.find(t => t.language === 'en')?.title ?? 'Untitled' }}
        </h3>
        <p class="text-sm text-gray-400 leading-relaxed flex-1">
          {{ article.translations.find(t => t.language === 'en')?.excerpt ?? '' }}
        </p>

        <!-- Actions -->
        <div class="flex items-center gap-2 mt-6">
          <div class="text-blue-400" v-show="!store.isAdmin">Published {{ new Date(article.published_at).toLocaleDateString() }}</div>
          <button
            @click="deleteArticle(article.id)"
            v-show="store.isAdmin"
            class="border border-red-800/60 hover:border-red-600 text-red-400/60 hover:text-red-400 px-4 py-1.5 rounded-lg text-sm font-medium transition">
            Delete
          </button>
          <button
            @click="router.push(`/article/edit/${article.id}`)"
            v-show="store.isAdmin"
            class="border border-yellow-700/60 hover:border-yellow-500 text-yellow-400/60 hover:text-yellow-400 px-4 py-1.5 rounded-lg text-sm font-medium transition">
            Edit
          </button>
          <button
            @click="router.push(`/article/${article.id}`)"
            class="ml-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-1.5 rounded-lg text-sm font-medium transition">
            Read more
          </button>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="fetchSuccessfull === false"
      class="border border-slate-800 rounded-2xl flex items-center justify-center py-16 col-span-3">
      <p class="text-sm text-slate-600">Failed to load articles</p>
    </div>

  </div>
</template>