<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import api from '../api/axios'

  type Lang = 'en' | 'sk'

  type Translation = {
    id?: number
    language: string
    title: string
    excerpt: string
    content: string
  }

  type ArticleApi = {
    slug: string
    translations: Translation[]
  }

  type ArticleForm = {
    slug: string
    translations: Record<Lang, Translation>
  }

  type ApiResponse<T> = {
    data: T
  }

  const route = useRoute()
  const article_id = route.params.id

  const error = ref('')
  const router = useRouter()
  const stage = ref('main')

  const form = ref<ArticleForm>({
    slug: '',
    translations: {
      sk: {
        language: 'sk',
        title: '',
        excerpt: '',
        content: ''
      },
      en: {
        language: 'en',
        title: '',
        excerpt: '',
        content: ''
      }
    }
  })

  const file = ref<File | null>(null)

  const handleFile = (event: Event) => {
    const target = event.target as HTMLInputElement

    if (target.files && target.files.length > 0) {
      file.value = target.files[0] ?? null
    }

    console.log(file.value)
  }

  async function submit() {
    error.value = ''
    try {
      const formData = new FormData()

      formData.append('slug', form.value.slug)

      formData.append(
        'translations[en][id]',
        String(form.value.translations.en.id ?? '')
      )
      formData.append(
        'translations[en][title]',
        form.value.translations.en.title
      )
      formData.append(
        'translations[en][excerpt]',
        form.value.translations.en.excerpt
      )
      formData.append(
        'translations[en][content]',
        form.value.translations.en.content
      )
      formData.append(
        'translations[sk][id]',
        String(form.value.translations.sk.id ?? '')
      )
      formData.append(
        'translations[sk][title]',
        form.value.translations.sk.title
      )
      formData.append(
        'translations[sk][excerpt]',
        form.value.translations.sk.excerpt
      )
      formData.append(
        'translations[sk][content]',
        form.value.translations.sk.content
      )

      if (file.value) {
        formData.append('image', file.value)
      }

      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1])
      }

      if (article_id) {
        const res = await api.put(`/articles/${article_id}`, formData)
        console.log('Article updated successfully')
        router.push('/');
      }
      else {
        const res = await api.post('/articles', formData)
        console.log('Article added successfully')
        router.push('/');
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Error'
      console.log(e.response.data)
    }

    console.log(article_id)
  }

  const mapArticle = (data: ArticleApi): ArticleForm => {
    return {
      slug: data.slug,
      translations: Object.fromEntries(
        data.translations.map((t: any) => [
          t.language,
          {
            id: t.id,
            language: t.language,
            title: t.title,
            excerpt: t.excerpt,
            content: t.content
          }
        ])
      )
    }
  }

  onMounted(async () => {
    if (article_id) {
      const res = await api.get<ApiResponse<ArticleApi>>(`/articles/${article_id}`)
      form.value = mapArticle(res.data.data)
    }
  })
</script>

<template>
  <h1 class="font-bold text-4xl text-center p-4">Article Redactor</h1>
  <div class="flex justify-center">
    <form class="flex flex-col gap-2 mt-5" @submit.prevent="submit">
      <div class="text-red-500">{{ error }}</div>
      <div class="flex gap-4 mb-4">
        <button type="button" @click="stage='main'" class="flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white h-10 mt-4">Main</button>
        <button type="button" @click="stage='translation-sk'" class="flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white h-10 mt-4">Translation SK</button>
        <button type="button" @click="stage='translation-en'" class="flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white h-10 mt-4">Translation EN</button>
      </div>

      <div v-show="stage == 'main'">
        <div>
          <label for="slug" class="block text-white">Slug</label>
          <input type="text" v-model="form.slug" name="slug" id="slug" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
        </div>
        <div>
          <label for="image" class="block text-white">Image</label>
          <input type="file" @change="handleFile" name="image" id="image" accept=".jpg,.jpeg,.png,.webp" class="bg-blue-600/10 border border-blue-900 rounded-md text-gray-400 mt-1 w-100 h-9" />
        </div>
      </div>

      <div v-show="stage == 'translation-sk'">
        <div>
          <label for="title" class="block text-white">Title</label>
          <input type="text" v-model="form.translations.sk.title" name="title" id="title" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
        </div>
        <div>
          <label for="excerpt" class="block text-white">Excerpt</label>
          <input type="text" v-model="form.translations.sk.excerpt" name="excerpt" id="excerpt" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
        </div>
        <div>
          <label for="content" class="block text-white">Text</label>
          <textarea name="content" v-model="form.translations.sk.content" id="content" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-27"></textarea>
        </div>
      </div>

      <div v-show="stage == 'translation-en'">
        <div>
          <label for="title" class="block text-white">Title</label>
          <input type="text" v-model="form.translations.en.title" name="title" id="title" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
        </div>
        <div>
          <label for="excerpt" class="block text-white">Excerpt</label>
          <input type="text" v-model="form.translations.en.excerpt" name="excerpt" id="excerpt" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
        </div>
        <div>
          <label for="content" class="block text-white">Text</label>
          <textarea name="content" v-model="form.translations.en.content" id="content" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-27"></textarea>
        </div>
      </div>

      <div class="flex gap-4">
        <button type="button" @click="router.push('/')" class="flex-1 bg-gray-600 hover:bg-gray-700 cursor-pointer text-white h-10 mt-4">Back</button>
        <button type="submit" class="flex-3 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white h-10 mt-4">Submit</button>
      </div>
    </form>
  </div>
</template>