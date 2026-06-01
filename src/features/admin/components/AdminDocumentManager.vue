<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getAdminDocuments } from '@/features/admin/api/admin'
import { downloadDocumentBlob } from '@/shared/api/documents'
import type { DocumentItem } from '@/features/admin/types/admin'

const search = ref<string>('')
const date = ref<string>('')
const documents = ref<DocumentItem[]>([])
const loading = ref<boolean>(false)
const error = ref<string>('')
const page = ref<number>(1)
const totalPages = ref<number>(1)

const pageInfo = computed(() => `${page.value} / ${totalPages.value}`)

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

const isPdf = (mimeType: string) => mimeType.toLowerCase().startsWith('application/pdf')

const fetchDocuments = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await getAdminDocuments({
      search: search.value || undefined,
      date: date.value || undefined,
      page: page.value,
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

const handleSearch = () => {
  page.value = 1
  fetchDocuments()
}

const prevPage = () => {
  if (page.value > 1) { page.value -= 1; fetchDocuments() }
}

const nextPage = () => {
  if (page.value < totalPages.value) { page.value += 1; fetchDocuments() }
}

const fetchBlob = async (url: string) => {
  const response = await downloadDocumentBlob(url)
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
  if (!isPdf(mimeType)) { error.value = 'Preview is only available for PDF files.'; return }
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

onMounted(() => fetchDocuments())
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
      <h3 class="text-xl font-bold text-white">Documents</h3>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <div class="sm:col-span-1">
        <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Search</label>
        <input
          v-model="search"
          @keyup.enter="handleSearch"
          placeholder="Search by file name..."
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-600 outline-none"
        />
      </div>

      <div>
        <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Created Date</label>
        <input
          v-model="date"
          type="date"
          @change="handleSearch"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-600 outline-none"
        />
      </div>

      <div class="flex items-end gap-2">
        <button
          type="button"
          @click="handleSearch"
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 rounded-lg transition text-sm"
        >
          Apply
        </button>
        <button
          type="button"
          @click="resetFilters"
          class="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-1.5 rounded-lg transition text-sm"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="mb-4 px-4 py-3 rounded-xl border border-red-900 bg-red-950/40 text-sm font-mono text-red-400"
    >
      {{ error }}
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-xl border border-slate-800">
      <table class="min-w-full border-collapse text-left text-sm text-slate-200">
        <thead>
          <tr class="bg-slate-900/80">
            <th class="px-5 py-3 text-xs font-mono uppercase text-slate-500 tracking-wider">File Name</th>
            <th class="px-5 py-3 text-xs font-mono uppercase text-slate-500 tracking-wider">Size</th>
            <th class="px-5 py-3 text-xs font-mono uppercase text-slate-500 tracking-wider">Uploaded</th>
            <th class="px-5 py-3 text-xs font-mono uppercase text-slate-500 tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-slate-950">
          <tr v-if="loading">
            <td colspan="4" class="px-5 py-6 text-center text-sm text-slate-500 italic animate-pulse">
              Loading documents…
            </td>
          </tr>
          <tr v-else-if="documents.length === 0">
            <td colspan="4" class="px-5 py-6 text-center text-sm text-slate-500 italic">
              No documents found for the current filters.
            </td>
          </tr>
          <tr
            v-else
            v-for="document in documents"
            :key="document.id"
            class="border-t border-slate-800 hover:bg-slate-900/40 transition"
          >
            <td class="px-5 py-4">
              <div class="font-medium text-white">{{ document.file_name }}</div>
              <div v-if="document.application_name" class="mt-0.5 text-xs text-slate-500 font-mono">
                {{ document.application_name }}
              </div>
            </td>
            <td class="px-5 py-4 text-sm text-slate-400 font-mono">
              {{ formatFileSize(document.file_size_bytes ?? 0) }}
            </td>
            <td class="px-5 py-4 text-sm text-slate-400 font-mono">
              {{ document.created_at ? new Date(document.created_at).toLocaleString() : '—' }}
            </td>
            <td class="px-5 py-4">
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="downloadFile(document.id, document.file_name)"
                  :disabled="loading"
                  class="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-slate-300 transition-all font-mono disabled:opacity-50"
                >
                  Download
                </button>
                <button
                  v-if="document.mime_type && isPdf(document.mime_type)"
                  type="button"
                  @click="previewFile(document.id, document.mime_type ?? '')"
                  :disabled="loading"
                  class="text-sm bg-blue-900/40 hover:bg-blue-900/60 px-4 py-2 rounded border border-blue-800 text-blue-400 transition-all font-mono disabled:opacity-50"
                >
                  Preview
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <span class="text-xs font-mono text-slate-500">Page {{ pageInfo }}</span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="prevPage"
          :disabled="page === 1 || loading"
          class="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-slate-300 transition font-mono disabled:opacity-50"
        >
          ← Previous
        </button>
        <button
          type="button"
          @click="nextPage"
          :disabled="page === totalPages || loading"
          class="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-slate-300 transition font-mono disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>