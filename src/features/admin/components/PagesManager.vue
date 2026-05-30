<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import type { Editor as CoreEditor } from '@tiptap/core'
import {
  getAdminPages,
  createAdminPage,
  updateAdminPage,
  deleteAdminPage,
  toggleAdminPagePublish
} from '@/features/pages/api/pages'
import type { Page, PageForm, PageLang, PageTranslation } from '@/features/pages/types/pages'

const pages = ref<Page[]>([])
const editing = ref<Page | null>(null)
const showForm = ref(false)
const saving = ref(false)
const error = ref('')
const activeTab = ref<'main' | 'sk' | 'en'>('main')

const form = ref<PageForm>({
  slug: '',
  is_published: false,
  translations: {
    sk: { language: 'sk', title: '', content: '', meta_title: '', meta_description: '' },
    en: { language: 'en', title: '', content: '', meta_title: '', meta_description: '' }
  }
})

const skEditor = new Editor({
  extensions: [StarterKit],
  content: '',
  editorProps: { attributes: { class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] text-white p-3 text-sm' } },
  onUpdate: ({ editor }: { editor: CoreEditor }) => { form.value.translations.sk.content = editor.getHTML() }
})

const enEditor = new Editor({
  extensions: [StarterKit],
  content: '',
  editorProps: { attributes: { class: 'prose prose-invert max-w-none focus:outline-none min-h-[150px] text-white p-3 text-sm' } },
  onUpdate: ({ editor }: { editor: CoreEditor }) => { form.value.translations.en.content = editor.getHTML() }
})

async function load() {
  const res = await getAdminPages()
  pages.value = res.data.data
}

function openCreate() {
  editing.value = null
  form.value = {
    slug: '',
    is_published: false,
    translations: {
      sk: { language: 'sk', title: '', content: '', meta_title: '', meta_description: '' },
      en: { language: 'en', title: '', content: '', meta_title: '', meta_description: '' }
    }
  }
  skEditor.commands.setContent('')
  enEditor.commands.setContent('')
  activeTab.value = 'main'
  showForm.value = true
}

function openEdit(p: Page) {
  editing.value = p
  const get = (lang: PageLang) =>
      p.translations.find(t => t.language === lang) ?? { language: lang, title: '', content: '', meta_title: '', meta_description: '' }
  form.value = {
    slug: p.slug,
    is_published: p.is_published,
    translations: {
      sk: { ...get('sk') } as PageTranslation & { id?: number },
      en: { ...get('en') } as PageTranslation & { id?: number }
    }
  }
  skEditor.commands.setContent(form.value.translations.sk.content)
  enEditor.commands.setContent(form.value.translations.en.content)
  activeTab.value = 'main'
  showForm.value = true
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    const payload = {
      slug: form.value.slug,
      is_published: form.value.is_published,
      translations: Object.values(form.value.translations)
    }
    if (editing.value) {
      await updateAdminPage(editing.value.id, payload)
    } else {
      await createAdminPage(payload)
    }
    showForm.value = false
    await load()
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Save failed'
  } finally {
    saving.value = false
  }
}

async function togglePublish(p: Page) {
  await toggleAdminPagePublish(p.id, !p.is_published)
  await load()
}

async function remove(p: Page) {
  if (!confirm(`Delete page "${p.slug}"?`)) return
  await deleteAdminPage(p.id)
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-white font-bold text-lg">CMS Pages</h2>
      <button @click="openCreate" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">+ New Page</button>
    </div>

    <div v-if="!showForm">
      <table class="w-full text-sm text-slate-300">
        <thead>
        <tr class="text-xs text-slate-500 uppercase border-b border-slate-800">
          <th class="text-left py-2 pr-4">Slug</th>
          <th class="text-left py-2 pr-4">Published</th>
          <th class="text-left py-2">Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="p in pages" :key="p.id" class="border-b border-slate-800/50">
          <td class="py-2 pr-4 font-mono text-xs text-blue-300">/{{ p.slug }}</td>
          <td class="py-2 pr-4">
            <button @click="togglePublish(p)" :class="p.is_published ? 'text-green-400' : 'text-slate-500'" class="text-xs font-semibold">
              {{ p.is_published ? 'Published' : 'Draft' }}
            </button>
          </td>
          <td class="py-2 flex gap-2">
            <button @click="openEdit(p)" class="text-xs text-slate-400 hover:text-white transition">Edit</button>
            <button @click="remove(p)" class="text-xs text-red-400 hover:text-red-300 transition">Delete</button>
          </td>
        </tr>
        </tbody>
      </table>
      <p v-if="pages.length === 0" class="text-slate-500 text-sm mt-4">No pages yet.</p>
    </div>

    <div v-else class="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 max-w-2xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-white font-semibold">{{ editing ? 'Edit Page' : 'New Page' }}</h3>
        <button @click="showForm = false" class="text-xs text-slate-500 hover:text-white transition">← Back</button>
      </div>

      <div class="flex border-b border-slate-800 mb-4 gap-2">
        <button v-for="t in ['main','sk','en']" :key="t" type="button"
                @click="activeTab = t as 'main'|'sk'|'en'"
                :class="['px-4 py-2 text-xs uppercase font-bold tracking-wider border-b-2 transition outline-none',
activeTab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300']">
          {{ t === 'main' ? 'General' : t.toUpperCase() }}
        </button>
      </div>

      <p v-if="error" class="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-3 rounded-lg mb-4">{{ error }}</p>

      <div v-show="activeTab === 'main'" class="flex flex-col gap-4">
        <div>
          <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Slug</label>
          <input type="text" v-model="form.slug" placeholder="e.g. about-nti" class="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-blue-600 mt-1" />
        </div>
        <div class="flex items-center gap-3">
          <input type="checkbox" v-model="form.is_published" id="page-published" class="accent-blue-600" />
          <label for="page-published" class="text-xs text-slate-400">Published</label>
        </div>
      </div>

      <template v-for="lang in ['sk','en'] as PageLang[]" :key="lang">
        <div v-show="activeTab === lang" class="flex flex-col gap-4">
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Title ({{ lang.toUpperCase() }})</label>
            <input type="text" v-model="form.translations[lang].title" class="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-blue-600 mt-1" />
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Meta Title</label>
            <input type="text" v-model="form.translations[lang].meta_title" class="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-blue-600 mt-1" />
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Meta Description</label>
            <input type="text" v-model="form.translations[lang].meta_description" class="w-full bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-blue-600 mt-1" />
          </div>
          <div>
            <label class="text-xs font-semibold tracking-wider text-slate-400 uppercase block mb-1">Content ({{ lang.toUpperCase() }})</label>
            <div class="border border-slate-800 bg-slate-950 rounded-lg overflow-hidden focus-within:border-blue-600 transition">
              <div class="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex gap-1">
                <button v-if="lang === 'sk'" type="button" @click="skEditor.chain().focus().toggleBold().run()" :class="['px-2 py-0.5 rounded text-xs', skEditor.isActive('bold') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800']">B</button>
                <button v-if="lang === 'sk'" type="button" @click="skEditor.chain().focus().toggleItalic().run()" :class="['px-2 py-0.5 rounded text-xs italic', skEditor.isActive('italic') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800']">I</button>
                <button v-if="lang === 'en'" type="button" @click="enEditor.chain().focus().toggleBold().run()" :class="['px-2 py-0.5 rounded text-xs', enEditor.isActive('bold') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800']">B</button>
                <button v-if="lang === 'en'" type="button" @click="enEditor.chain().focus().toggleItalic().run()" :class="['px-2 py-0.5 rounded text-xs italic', enEditor.isActive('italic') ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800']">I</button>
              </div>
              <EditorContent :editor="lang === 'sk' ? skEditor : enEditor" />
            </div>
          </div>
        </div>
      </template>

      <div class="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
        <button @click="showForm = false" class="text-xs text-slate-400 hover:text-white transition px-4 py-2">Cancel</button>
        <button @click="save" :disabled="saving" class="bg-blue-600 hover:bg-blue-500 font-semibold px-6 h-10 rounded-lg text-xs tracking-wide uppercase text-white transition disabled:opacity-50">
          {{ saving ? 'Saving...' : (editing ? 'Update' : 'Create') }}
        </button>
      </div>
    </div>
  </div>
</template>