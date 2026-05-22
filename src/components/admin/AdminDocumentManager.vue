<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/api/axios'

interface DocumentItem {
  id: number
  file_name: string
  mime_type: string
  file_size_bytes: number
  created_at: string
  uploaded_by: number
}

const search = ref('')
const date = ref('')
const documents = ref<DocumentItem[]>([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const totalPages = ref(1)

const pageInfo = computed(() => `${page.value} / ${totalPages.value}`)

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return `${(bytes / 1024).toFixed(1)} KB`
}

const isPdf = (mimeType: string) => mimeType.toLowerCase().startsWith('application/pdf')

const fetchDocuments = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api.get('/admin/documents', {
      params: {
        search: search.value || undefined,
        date: date.value || undefined,
        page: page.value,
      },
    })

    documents.value = response.data.data ?? response.data
    totalPages.value = response.data.last_page ?? 1
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load documents.'
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  search.value = ''
  date.value = ''
  page.value = 1
  fetchDocuments()
}

const prevPage = () => {
  if (page.value > 1) {
    page.value -= 1
    fetchDocuments()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value += 1
    fetchDocuments()
  }
}

const fetchBlob = async (url: string) => {
  const response = await api.get(url, { responseType: 'blob' })
  return response.data as Blob
}

const downloadFile = async (docId: number, fileName: string) => {
  error.value = ''
  loading.value = true

  try {
    const blob = await fetchBlob(`/documents/${docId}/download`)
    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(objectUrl)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Download failed.'
  } finally {
    loading.value = false
  }
}

const previewFile = async (docId: number, mimeType: string) => {
  error.value = ''
  if (!isPdf(mimeType)) {
    error.value = 'Preview is only available for PDF files.'
    return
  }

  loading.value = true

  try {
    const blob = await fetchBlob(`/documents/${docId}/preview`)
    const objectUrl = window.URL.createObjectURL(blob)
    window.open(objectUrl, '_blank')
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 10000)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Preview failed.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDocuments()
})
</script>

<template>
  <div class="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
      <div class="flex-1 min-w-0">
        <label class="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-2">Search documents</label>
        <input
          v-model="search"
          @keyup.enter="() => { page.value = 1; fetchDocuments() }"
          placeholder="Search by file name"
          class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div class="flex-1 min-w-0">
        <label class="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 mb-2">Created date</label>
        <input
          v-model="date"
          type="date"
          @change="() => { page.value = 1; fetchDocuments() }"
          class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          @click="() => { page.value = 1; fetchDocuments() }"
          class="inline-flex items-center justify-center rounded-full border border-slate-700 bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Apply
        </button>
        <button
          type="button"
          @click="resetFilters"
          class="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-900"
        >
          Reset
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 rounded-2xl border border-red-700 bg-red-900/20 px-4 py-3 text-sm text-red-200">
      {{ error }}
    </div>

    <div class="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/30">
      <table class="min-w-full border-collapse text-left text-sm text-slate-200">
        <thead class="bg-slate-900/90 text-xs uppercase tracking-[0.18em] text-slate-500">
          <tr>
            <th class="px-5 py-4">File Name</th>
            <th class="px-5 py-4">Size</th>
            <th class="px-5 py-4">Uploaded</th>
            <th class="px-5 py-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="animate-pulse">
            <td colspan="4" class="px-5 py-6 text-slate-500">Loading documents…</td>
          </tr>
          <tr v-else-if="documents.length === 0">
            <td colspan="4" class="px-5 py-6 text-slate-500">No documents found for the current filters.</td>
          </tr>
          <tr v-else v-for="document in documents" :key="document.id" class="border-t border-slate-800 hover:bg-slate-900/40">
            <td class="px-5 py-4 font-medium text-slate-100">{{ document.file_name }}</td>
            <td class="px-5 py-4 text-slate-400">{{ formatFileSize(document.file_size_bytes) }}</td>
            <td class="px-5 py-4 text-slate-400">{{ new Date(document.created_at).toLocaleDateString() }}</td>
            <td class="px-5 py-4">
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="downloadFile(document.id, document.file_name)"
                  :disabled="loading"
                  class="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Download
                </button>
                <button
                  v-if="isPdf(document.mime_type)"
                  type="button"
                  @click="previewFile(document.id, document.mime_type)"
                  :disabled="loading"
                  class="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Preview
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-slate-400">
      <div class="text-sm">Page {{ pageInfo }}</div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="prevPage"
          :disabled="page === 1 || loading"
          class="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          @click="nextPage"
          :disabled="page === totalPages || loading"
          class="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
