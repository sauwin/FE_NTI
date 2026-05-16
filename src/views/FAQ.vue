<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../api/axios'
import { useAuthStore } from '../stores/auth'

type FaqItem = {
  id: number
  page_context: string
  order_position: number
  is_active: boolean
  question: string
  answer: string
}

const auth = useAuthStore()
const isAdmin = computed(() => auth.isAdmin)
const open = ref<number | null>(null)
const faqItems = ref<FaqItem[]>([])
const isFormVisible = ref(false)
const editingId = ref<number | null>(null)
const isSaving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const formState = reactive({
  page_context: 'general',
  question: '',
  answer: '',
  is_active: true,
  order_position: 0,
})

function toggle(i: number) {
  open.value = open.value === i ? null : i
}

function resetForm() {
  editingId.value = null
  isFormVisible.value = false
  formState.page_context = 'general'
  formState.question = ''
  formState.answer = ''
  formState.is_active = true
  formState.order_position = faqItems.value.length
  error.value = null
  success.value = null
}

function showCreateForm() {
  resetForm()
  isFormVisible.value = true
}

function editFaq(faq: FaqItem) {
  editingId.value = faq.id
  formState.page_context = faq.page_context
  formState.question = faq.question
  formState.answer = faq.answer
  formState.is_active = faq.is_active
  formState.order_position = faq.order_position
  isFormVisible.value = true
  open.value = faq.id
}

async function fetchFaqs() {
  try {
    const res = await api.get('/faq-items', {
      params: { page_context: 'general' },
    })
    faqItems.value = res.data.data ?? res.data
  } catch {
    error.value = 'Unable to load FAQ items.'
  }
}

async function saveFaq() {
  error.value = null
  success.value = null
  isSaving.value = true

  try {
    if (editingId.value) {
      await api.put(`/faq-items/${editingId.value}`, {
        page_context: formState.page_context,
        question: formState.question,
        answer: formState.answer,
        is_active: formState.is_active,
        order_position: formState.order_position,
      })
      success.value = 'FAQ updated successfully.'
    } else {
      await api.post('/faq-items', {
        page_context: formState.page_context,
        question: formState.question,
        answer: formState.answer,
        is_active: formState.is_active,
        order_position: formState.order_position,
      })
      success.value = 'FAQ created successfully.'
    }
    resetForm()
    await fetchFaqs()
  } catch {
    error.value = 'Unable to save FAQ. Make sure you are logged in with admin access.'
  } finally {
    isSaving.value = false
  }
}

async function deleteFaq(id: number) {
  if (!confirm('Are you sure you want to delete this FAQ?')) {
    return
  }

  error.value = null
  success.value = null

  try {
    await api.delete(`/faq-items/${id}`)
    success.value = 'FAQ deleted successfully.'
    await fetchFaqs()
  } catch {
    error.value = 'Unable to delete FAQ. Make sure you are logged in with admin access.'
  }
}

onMounted(() => {
  fetchFaqs()
})
</script>

<template>
  <div class="container-main">
    <div class="bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>

    <div class="section-divider-md">
      <div class="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-6">
        FAQ
      </div>
      <h1 class="font-bold text-6xl leading-tight mb-7">
        Frequently asked <span class="text-blue-400">questions</span>
      </h1>
      <p class="text-gray-400 max-w-xl text-base leading-relaxed">
        Everything you need to know about NTI programs, applications, and the process.
      </p>
    </div>

    <section class="max-w-3xl space-y-8">
      <div v-if="isAdmin" class="rounded-3xl border border-slate-800 bg-slate-950 p-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-white">Admin FAQ editor</h2>
            <p class="text-sm text-slate-400">Create, update, and remove FAQ entries for the public FAQ page.</p>
          </div>
          <button type="button" @click="showCreateForm" class="inline-flex items-center justify-center rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">
            Add FAQ
          </button>
        </div>

        <div v-if="error || success" class="mt-5 space-y-2">
          <div v-if="error" class="rounded-lg border border-red-700 bg-red-950 px-4 py-3 text-sm text-red-300">{{ error }}</div>
          <div v-if="success" class="rounded-lg border border-emerald-700 bg-emerald-950 px-4 py-3 text-sm text-emerald-300">{{ success }}</div>
        </div>

        <form v-if="isFormVisible" @submit.prevent="saveFaq" class="mt-6 grid gap-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-2 text-sm text-slate-300">
              Question
              <input v-model="formState.question" type="text" class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-blue-400 focus:outline-none" placeholder="What is NTI?" required />
            </label>
            <label class="space-y-2 text-sm text-slate-300">
              Answer
              <textarea v-model="formState.answer" rows="4" class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-blue-400 focus:outline-none" placeholder="NTI is ..." required />
            </label>
          </div>

          <div class="grid gap-4 sm:grid-cols-3">
            <label class="space-y-2 text-sm text-slate-300">
              Page context
              <select v-model="formState.page_context" class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-blue-400 focus:outline-none">
                <option value="general">General</option>
                <option value="program_a">Program A</option>
                <option value="program_b">Program B</option>
              </select>
            </label>
            <label class="space-y-2 text-sm text-slate-300">
              Active
              <select v-model="formState.is_active" class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-blue-400 focus:outline-none">
                <option :value="true">Yes</option>
                <option :value="false">No</option>
              </select>
            </label>
            <label class="space-y-2 text-sm text-slate-300">
              Order position
              <input v-model.number="formState.order_position" type="number" min="0" class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-blue-400 focus:outline-none" />
            </label>
          </div>

          <div class="flex flex-wrap gap-3">
            <button type="submit" class="inline-flex items-center justify-center rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400" :disabled="isSaving">
              {{ editingId ? 'Save changes' : 'Create FAQ' }}
            </button>
            <button type="button" class="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500" @click="resetForm" :disabled="isSaving">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div class="rounded-3xl border border-slate-800 bg-slate-950 p-6">
        <div class="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="text-2xl font-semibold text-white">Current FAQ</h2>
            <p class="text-sm text-slate-400">Tap a question to expand the answer.</p>
          </div>
          <div v-if="isAdmin" class="text-sm text-slate-400">Admin editing is enabled for your account.</div>
        </div>

        <div v-if="faqItems.length === 0" class="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-10 text-center text-slate-500">
          No FAQ items found.
        </div>

        <div v-for="faq in faqItems" :key="faq.id" class="border-b border-slate-800 last:border-b-0">
          <div class="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <button @click="toggle(faq.id)" class="text-left flex-1">
              <div class="flex items-center justify-between gap-4">
                <span class="text-base font-medium text-white">{{ faq.question }}</span>
                <span class="text-blue-400 text-lg shrink-0 transition-transform duration-200" :class="open === faq.id ? 'rotate-45' : ''">+</span>
              </div>
            </button>

            <div v-if="isAdmin" class="flex gap-2">
              <button type="button" @click="editFaq(faq)" class="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-blue-500">Edit</button>
              <button type="button" @click="deleteFaq(faq.id)" class="rounded-full border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-300 transition hover:bg-red-900">Delete</button>
            </div>
          </div>
          <div v-if="open === faq.id" class="pb-5 text-sm text-gray-400 leading-relaxed">
            {{ faq.answer }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
