<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import api from '../api/axios'

  const router = useRouter()

  const articlesObj = ref<Article[] | null>(null)
  const fetchSuccessfull = ref<boolean | null>(null);

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
    translation: Translation[]
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
      articlesObj.value = res.data.data.slice(0, 2)
      fetchSuccessfull.value = true
    } catch(e: any) {
      fetchSuccessfull.value = false
    }
  }

  onMounted(() => {
    fetchData()
  })
</script>

<template>
  <h2 class="text-xl font-medium mb-2 bg-blue-600 w-35 py-2 pl-8 rounded-r-2xl">Články</h2>

  <div class="flex w-screen bg-slate-900 gap-20 py-8 px-12">
    <div class="w-100 border-6 border-gray-700/80 hover:border-gray-600 text-gray-700/80 hover:text-gray-600 pb-4 flex justify-center items-center rounded-3xl text-9xl select-none transition">
      +
    </div>

    <div v-for="article in articlesObj" class="w-100 border-3 border-blue-600/90 flex flex-col items-center rounded-3xl">
      <h2 class="text-xl p-4">{{ article.translation.find(t => t.language == 'en')?.title }}</h2>
      <img src="/missing_image.png" class="w-[85%] h-45 object-cover">
      <div class="px-8 py-4">
        {{ article.translation.find(t => t.language == 'en')?.excerpt }}
      </div>
      <div class="flex w-full px-8 pb-6 gap-3 justify-end">
        <button class="border-3 border-red-600/50 hover:border-red-700 text-red-500/50 hover:text-red-600 px-6 py-1 rounded-lg font-medium transition">Delete</button>
        <button @click="() => router.push('/article/edit')" class="border-3 border-yellow-500/50 hover:border-yellow-500 text-yellow-400/50 hover:text-yellow-500 px-6 py-1 rounded-lg font-medium transition mr-">Edit</button>
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1 rounded-lg font-medium transition">Read more</button>
      </div>
    </div>
  </div>
</template>