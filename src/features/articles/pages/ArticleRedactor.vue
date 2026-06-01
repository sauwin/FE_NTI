<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import type { Editor as CoreEditor } from '@tiptap/core'
import { createArticle, updateArticle, getArticleForEdit } from '@/features/articles/api/articles'
import type { ArticleApi, ArticleLang, ArticleTranslation, ArticleForm } from '@/features/articles/types/articles'

const route = useRoute()
// Fixed route parameter assignment issue (guarantees a unified string format)
const rawId = route.params.id
const article_id = Array.isArray(rawId) ? rawId[0] : rawId

const error = ref('')
const isSubmitting = ref(false)
const router = useRouter()

// Tabs navigation state
const activeTab = ref<'main' | 'sk' | 'en'>('main')

const form = ref<ArticleForm>({
  slug: '',
  translations: {
    sk: { language: 'sk', title: '', excerpt: '', content: '' },
    en: { language: 'en', title: '', excerpt: '', content: '' }
  }
})

const file = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

// Initialize TipTap editors with explicit strict parameter contracts
const skEditor = new Editor({
  extensions: [StarterKit],
  content: '',
  editorProps: {
    attributes: {
      class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] text-white p-3 text-sm'
    }
  },
  onUpdate: ({ editor }: { editor: CoreEditor }) => {
    form.value.translations.sk.content = editor.getHTML()
  }
})

const enEditor = new Editor({
  extensions: [StarterKit],
  content: '',
  editorProps: {
    attributes: {
      class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] text-white p-3 text-sm'
    }
  },
  onUpdate: ({ editor }: { editor: CoreEditor }) => {
    form.value.translations.en.content = editor.getHTML()
  }
})

const handleFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const selectedFile: File | null = target.files[0] ?? null
    file.value = selectedFile
    
    if (selectedFile) {
      imagePreview.value = URL.createObjectURL(selectedFile)
    } else {
      imagePreview.value = null
    }
  }
}

async function submit() {
  error.value = ''
  isSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('slug', form.value.slug)
    
    // Append structured localization entries explicitly
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
      await updateArticle(article_id, formData)
    } else {
      await createArticle(formData)
    }
    router.push('/')
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save article configuration'
  } finally {
    isSubmitting.value = false
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
    ) as Record<ArticleLang, ArticleTranslation & { id?: number }>
  }
}

onMounted(async () => {
  if (article_id) {
    const res = await getArticleForEdit(article_id)
    const mapped = mapArticle(res.data.data)
    form.value = mapped
    
    // Seed hydration payload directly into text editor contexts
    skEditor.commands.setContent(mapped.translations.sk?.content || '')
    enEditor.commands.setContent(mapped.translations.en?.content || '')
  }
})
</script>

<template>
  <div class="flex-center-page">
    <div class="w-full max-w-2xl bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-md">

      <div class="mb-6 flex items-center justify-between">
        <div>
          <div class="inline-block text-[10px] font-bold tracking-widest uppercase text-blue-400 bg-blue-600/10 border border-blue-900/50 px-3 py-1 rounded-full mb-1">
            {{ article_id ? 'Edit Article' : 'Create Article' }}
          </div>
          <h1 class="font-bold text-2xl text-white">Article Editor</h1>
        </div>
        <button type="button" @click="router.push('/')" class="text-xs text-slate-500 hover:text-white transition">
          ← Back to Catalog
        </button>
      </div>

      <div class="flex border-b border-slate-800 mb-6 gap-2">
        <button 
          type="button" 
          @click="activeTab = 'main'"
          :class="['px-4 py-2 text-xs uppercase font-bold tracking-wider border-b-2 transition outline-none', 
            activeTab === 'main' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300']"
        >
          General Data
        </button>
        <button 
          type="button" 
          @click="activeTab = 'sk'"
          :class="['px-4 py-2 text-xs uppercase font-bold tracking-wider border-b-2 transition outline-none', 
            activeTab === 'sk' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300']"
        >
          Slovak (SK)
        </button>
        <button 
          type="button" 
          @click="activeTab = 'en'"
          :class="['px-4 py-2 text-xs uppercase font-bold tracking-wider border-b-2 transition outline-none', 
            activeTab === 'en' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300']"
        >
          English (EN)
        </button>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <p v-if="error" class="text-xs font-mono text-red-400 bg-red-950/30 border border-red-900/50 p-3 rounded-lg">{{ error }}</p>

        <div v-show="activeTab === 'main'" class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Slug Endpoint</label>
            <input type="text" v-model="form.slug" placeholder="e.g. dynamic-mentorship-guidelines" class="input-mt w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-blue-600 mt-1" />
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase block mb-1">Cover Image Illustration</label>
            <div class="flex items-center gap-4 border border-dashed border-slate-800 rounded-lg p-4 bg-slate-950/20">
              <div v-if="imagePreview" class="w-20 h-20 rounded-md overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-800">
                <img :src="imagePreview" class="w-full h-full object-cover" alt="Preview" />
              </div>
              <div class="flex-1">
                <input type="file" @change="handleFile" accept=".jpg,.jpeg,.png,.webp" id="article-file-input" class="hidden" />
                <label for="article-file-input" class="inline-block bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2 rounded border border-slate-700 cursor-pointer transition">
                  Select System File
                </label>
                <p class="text-[10px] text-slate-500 mt-1.5">Supported endings: WebP, PNG or JPEG formatting profiles.</p>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'sk'" class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Title (SK)</label>
            <input type="text" v-model="form.translations.sk.title" class="input-mt w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-blue-600 mt-1" />
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Excerpt / Summary (SK)</label>
            <input type="text" v-model="form.translations.sk.excerpt" class="input-mt w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-blue-600 mt-1" />
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase block mb-1">Rich Text Content Layout (SK)</label>
            <div class="border border-slate-800 bg-slate-950 rounded-lg overflow-hidden focus-within:border-blue-600 transition">
              <div class="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex flex-wrap gap-1">
                <button type="button" @click="skEditor.chain().focus().toggleBold().run()" :class="['px-2 py-0.5 rounded text-xs', skEditor.isActive('bold') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800']">B</button>
                <button type="button" @click="skEditor.chain().focus().toggleItalic().run()" :class="['px-2 py-0.5 rounded text-xs italic', skEditor.isActive('italic') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800']">I</button>
                <button type="button" @click="skEditor.chain().focus().toggleBulletList().run()" :class="['px-2 py-0.5 rounded text-xs', skEditor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800']">• List</button>
              </div>
              <EditorContent :editor="skEditor" />
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'en'" class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Title (EN)</label>
            <input type="text" v-model="form.translations.en.title" class="input-mt w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-blue-600 mt-1" />
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Excerpt / Summary (EN)</label>
            <input type="text" v-model="form.translations.en.excerpt" class="input-mt w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-blue-600 mt-1" />
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase block mb-1">Rich Text Content Layout (EN)</label>
            <div class="border border-slate-800 bg-slate-950 rounded-lg overflow-hidden focus-within:border-blue-600 transition">
              <div class="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex flex-wrap gap-1">
                <button type="button" @click="enEditor.chain().focus().toggleBold().run()" :class="['px-2 py-0.5 rounded text-xs', enEditor.isActive('bold') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800']">B</button>
                <button type="button" @click="enEditor.chain().focus().toggleItalic().run()" :class="['px-2 py-0.5 rounded text-xs italic', enEditor.isActive('italic') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800']">I</button>
                <button type="button" @click="enEditor.chain().focus().toggleBulletList().run()" :class="['px-2 py-0.5 rounded text-xs', enEditor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800']">• List</button>
              </div>
              <EditorContent :editor="enEditor" />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-slate-800 mt-4">
          <button 
            type="submit"
            :disabled="isSubmitting"
            class="bg-blue-600 hover:bg-blue-500 font-semibold px-6 h-10 rounded-lg text-xs tracking-wide uppercase text-white transition disabled:opacity-50"
          >
            {{ isSubmitting ? 'Publishing...' : (article_id ? 'Update Article' : 'Publish Article') }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<style>
.prose ul {
  list-style-type: disc;
  padding-left: 1.25rem;
}
.prose ol {
  list-style-type: decimal;
  padding-left: 1.25rem;
}
</style>