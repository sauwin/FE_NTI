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
    sk: { language: 'sk', title: '', excerpt: '', content: '' },
    en: { language: 'en', title: '', excerpt: '', content: '' }
  }
})

const file = ref<File | null>(null)

const handleFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    file.value = target.files[0] ?? null
  }
}

async function submit() {
  error.value = ''
  try {
    const formData = new FormData()
    formData.append('slug', form.value.slug)
    formData.append('translations[en][id]', String(form.value.translations.en.id ?? ''))
    formData.append('translations[en][title]', form.value.translations.en.title)
    formData.append('translations[en][excerpt]', form.value.translations.en.excerpt)
    formData.append('translations[en][content]', form.value.translations.en.content)
    formData.append('translations[sk][id]', String(form.value.translations.sk.id ?? ''))
    formData.append('translations[sk][title]', form.value.translations.sk.title)
    formData.append('translations[sk][excerpt]', form.value.translations.sk.excerpt)
    formData.append('translations[sk][content]', form.value.translations.sk.content)
    if (file.value) formData.append('image', file.value)

    if (article_id) {
      await api.put(`/articles/${article_id}`, formData)
      router.push('/')
    } else {
      await api.post('/articles', formData)
      router.push('/')
    }
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error'
  }
}

const mapArticle = (data: ArticleApi): ArticleForm => {
  return {
    slug: data.slug,
    translations: Object.fromEntries(
      data.translations.map((t: any) => [
        t.language,
        { id: t.id, language: t.language, title: t.title, excerpt: t.excerpt, content: t.content }
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
  <div class="flex-center-page">
    <div class="w-full max-w-xl">

      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-600/10 border border-blue-900 px-4 py-1.5 rounded-full mb-4">
          {{ article_id ? 'Edit Article' : 'New Article' }}
        </div>
        <h1 class="font-bold text-4xl text-white">Article Editor</h1>
      </div>

      <!-- Stage indicator -->
      <div class="flex items-center mb-8">
        <div class="flex-center">
          <button type="button" @click="stage = 'main'"
            :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border transition',
              stage === 'main' ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500 hover:border-blue-600']">
            1
          </button>
          <span class="text-xs mt-1.5" :class="stage === 'main' ? 'text-blue-400' : 'text-gray-600'">Main</span>
        </div>

        <div class="flex-1 h-px mx-2 mb-4 bg-blue-900"></div>

        <div class="flex-center">
          <button type="button" @click="stage = 'translation-sk'"
            :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border transition',
              stage === 'translation-sk' ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500 hover:border-blue-600']">
            2
          </button>
          <span class="text-xs mt-1.5" :class="stage === 'translation-sk' ? 'text-blue-400' : 'text-gray-600'">SK</span>
        </div>

        <div class="flex-1 h-px mx-2 mb-4 bg-blue-900"></div>

        <div class="flex-center">
          <button type="button" @click="stage = 'translation-en'"
            :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border transition',
              stage === 'translation-en' ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500 hover:border-blue-600']">
            3
          </button>
          <span class="text-xs mt-1.5" :class="stage === 'translation-en' ? 'text-blue-400' : 'text-gray-600'">EN</span>
        </div>
      </div>

      <form class="flex-col-gap" @submit.prevent="submit">
        <p v-if="error" class="text-error-sm">{{ error }}</p>

        <!-- STAGE 1 — Main -->
        <div v-show="stage === 'main'" class="flex-col-gap">
          <div>
            <label class="label">Slug</label>
            <input type="text" v-model="form.slug"
              class="input-mt" />
          </div>
          <div>
            <label class="label">Image</label>
            <input type="file" @change="handleFile" accept=".jpg,.jpeg,.png,.webp"
              class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-gray-400 focus:outline-none focus:border-blue-500 file:hidden cursor-pointer" />
          </div>
          <button type="button" @click="stage = 'translation-sk'"
            class="bg-blue-600 hover:bg-blue-500 cursor-pointer text-white w-full h-10 mt-2 rounded-md text-sm font-medium transition">
            Continue to SK Translation →
          </button>
        </div>

        <!-- STAGE 2 — SK -->
        <div v-show="stage === 'translation-sk'" class="flex-col-gap">
          <div>
            <label class="label">Title (SK)</label>
            <input type="text" v-model="form.translations.sk.title"
              class="input-mt" />
          </div>
          <div>
            <label class="label">Excerpt (SK)</label>
            <input type="text" v-model="form.translations.sk.excerpt"
              class="input-mt" />
          </div>
          <div>
            <label class="label">Content (SK)</label>
            <textarea v-model="form.translations.sk.content" rows="6"
              class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"></textarea>
          </div>
          <div class="flex gap-3">
            <button type="button" @click="stage = 'main'"
              class="border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white w-1/3 h-10 rounded-md text-sm cursor-pointer transition">
              ← Back
            </button>
            <button type="button" @click="stage = 'translation-en'"
              class="bg-blue-600 hover:bg-blue-500 cursor-pointer text-white flex-1 h-10 rounded-md text-sm font-medium transition">
              Continue to EN Translation →
            </button>
          </div>
        </div>

        <!-- STAGE 3 — EN -->
        <div v-show="stage === 'translation-en'" class="flex-col-gap">
          <div>
            <label class="label">Title (EN)</label>
            <input type="text" v-model="form.translations.en.title"
              class="input-mt" />
          </div>
          <div>
            <label class="label">Excerpt (EN)</label>
            <input type="text" v-model="form.translations.en.excerpt"
              class="input-mt" />
          </div>
          <div>
            <label class="label">Content (EN)</label>
            <textarea v-model="form.translations.en.content" rows="6"
              class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"></textarea>
          </div>
          <div class="flex gap-3">
            <button type="button" @click="stage = 'translation-sk'"
              class="border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white w-1/3 h-10 rounded-md text-sm cursor-pointer transition">
              ← Back
            </button>
            <button type="submit"
              class="bg-blue-600 hover:bg-blue-500 cursor-pointer text-white flex-1 h-10 rounded-md text-sm font-medium transition">
              {{ article_id ? 'Save Changes' : 'Publish Article' }}
            </button>
          </div>
        </div>

        <!-- Back to home always visible -->
        <button type="button" @click="router.push('/')"
          class="border border-slate-700 hover:border-slate-500 text-gray-500 hover:text-gray-300 w-full h-9 rounded-md text-sm cursor-pointer transition mt-2">
          ← Back to Home
        </button>

      </form>
    </div>
  </div>
</template>