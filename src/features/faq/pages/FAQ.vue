<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getFaqItems, createFaqItem, updateFaqItem, deleteFaqItem } from '@/features/faq/api/faq'
import type { FaqItem } from '@/features/faq/types/faq'
import { useAuthStore } from '@/features/auth/stores/auth'
import {useConfirm} from "@/shared/composables/useConfirm.ts";

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
    const res = await getFaqItems({ page_context: 'general' })
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
      await updateFaqItem(editingId.value, {
        page_context: formState.page_context,
        question: formState.question,
        answer: formState.answer,
        is_active: formState.is_active,
        order_position: formState.order_position,
      })
      success.value = 'FAQ updated successfully.'
    } else {
      await createFaqItem({
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
  const confirmed = await useConfirm({
    title: 'Delete FAQ',
    message: 'Are you sure you want to delete this FAQ?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    danger: true,
  })

  if (!confirmed) {
    return
  }

  error.value = null
  success.value = null

  try {
    await deleteFaqItem(id)
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
  <div class="hidden md:block bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>

  <div class="section-divider-md">
    <div class="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-4 sm:mb-6">
      FAQ
    </div>
    <h1 class="font-bold text-3xl sm:text-5xl md:text-6xl leading-tight mb-5 sm:mb-7 break-words">
      Frequently asked <span class="text-blue-400">questions</span>
    </h1>
    <p class="text-gray-400 max-w-xl text-sm sm:text-base leading-relaxed">
      Everything you need to know about NTI programs, applications, and the process.
    </p>
  </div>

  <section class="max-w-3xl space-y-6 sm:space-y-8">
    <div v-if="isAdmin" class="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg sm:text-xl font-semibold text-white">Admin FAQ editor</h2>
          <p class="text-xs sm:text-sm text-slate-400">Create, update, and remove FAQ entries for the public FAQ page.</p>
        </div>
        <button type="button" @click="showCreateForm" class="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">
          Add FAQ
        </button>
      </div>

      <div v-if="error || success" class="mt-5 space-y-2">
        <div v-if="error" class="rounded-lg border border-red-700 bg-red-950 px-4 py-3 text-sm text-red-300 break-words">{{ error }}</div>
        <div v-if="success" class="rounded-lg border border-emerald-700 bg-emerald-950 px-4 py-3 text-sm text-emerald-300 break-words">{{ success }}</div>
      </div>

      <form v-if="isFormVisible" @submit.prevent="saveFaq" class="mt-6 grid gap-4">
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="space-y-2 text-sm text-slate-300">
            <span class="block">Question</span>
            <input v-model="formState.question" type="text" class="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 sm:py-3 text-white focus:border-blue-400 focus:outline-none text-sm sm:text-base" placeholder="What is NTI?" required />
          </label>
          <label class="space-y-2 text-sm text-slate-300">
            <span class="block">Answer</span>
            <textarea v-model="formState.answer" rows="4" class="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 sm:py-3 text-white focus:border-blue-400 focus:outline-none text-sm sm:text-base" placeholder="NTI is ..." required />
          </label>
        </div>

        <div class="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <label class="space-y-2 text-sm text-slate-300">
            <span class="block">Page context</span>
            <select v-model="formState.page_context" class="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 sm:py-3 text-white focus:border-blue-400 focus:outline-none text-sm sm:text-base">
              <option value="general">General</option>
              <option value="program_a">Program A</option>
              <option value="program_b">Program B</option>
            </select>
          </label>
          <label class="space-y-2 text-sm text-slate-300">
            <span class="block">Active</span>
            <select v-model="formState.is_active" class="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 sm:py-3 text-white focus:border-blue-400 focus:outline-none text-sm sm:text-base">
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </label>
          <label class="space-y-2 text-sm text-slate-300">
            <span class="block">Order position</span>
            <input v-model.number="formState.order_position" type="number" min="0" class="w-full rounded-xl sm:rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 sm:py-3 text-white focus:border-blue-400 focus:outline-none text-sm sm:text-base" />
          </label>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="submit" class="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400" :disabled="isSaving">
            {{ editingId ? 'Save changes' : 'Create FAQ' }}
          </button>
          <button type="button" class="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500" @click="resetForm" :disabled="isSaving">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div class="rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h2 class="text-xl sm:text-2xl font-semibold text-white">Current FAQ</h2>
          <p class="text-xs sm:text-sm text-slate-400">Tap a question to expand the answer.</p>
        </div>
        <div v-if="isAdmin" class="text-xs text-blue-400 sm:text-slate-400">Editing enabled.</div>
      </div>

      <div v-if="faqItems.length === 0" class="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-10 text-center text-slate-500 text-sm">
        No FAQ items found.
      </div>

      <div v-for="faq in faqItems" :key="faq.id" class="border-b border-slate-800 last:border-b-0">
        <div class="py-4 sm:py-5">
          <div class="flex items-start justify-between gap-3">
            <button @click="toggle(faq.id)" class="text-left flex-1 py-1 group">
              <div class="flex items-start justify-between gap-4">
                <span class="text-sm sm:text-base font-medium text-white group-hover:text-blue-400 transition-colors leading-snug">{{ faq.question }}</span>
                <span class="text-blue-400 text-lg font-bold shrink-0 transition-transform duration-200 line-height-1" :class="open === faq.id ? 'rotate-45' : ''">+</span>
              </div>
            </button>
          </div>

          <div v-if="isAdmin" class="flex gap-2 mt-3 sm:mt-2 justify-end">
            <button type="button" @click="editFaq(faq)" class="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs sm:text-sm text-slate-200 transition hover:border-blue-500">Edit</button>
            <button type="button" @click="deleteFaq(faq.id)" class="rounded-full border border-red-700 bg-red-950 px-3 py-1 text-xs sm:text-sm text-red-300 transition hover:bg-red-900">Delete</button>
          </div>

          <div v-if="open === faq.id" class="mt-3 text-xs sm:text-sm text-gray-400 leading-relaxed break-words">
            {{ faq.answer }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>