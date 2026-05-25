<script setup lang="ts">
import { ref } from 'vue'
import { downloadDocumentBlob } from '@/shared/api/documents'

interface Props {
  documentId: number
  fileName: string
  mimeType: string
}

const props = defineProps<Props>()
const downloading = ref(false)
const previewing = ref(false)
const error = ref('')

const createBlobUrl = (blob: Blob) => window.URL.createObjectURL(blob)
const downloadBlob = (blob: Blob) => {
  const url = createBlobUrl(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = props.fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

const fetchBlob = async (endpoint: string) => {
  const response = await downloadDocumentBlob(endpoint)
  if (!response.data) {
    throw new Error('Empty response from file server')
  }
  return response.data as Blob
}

const handleDownload = async () => {
  error.value = ''
  downloading.value = true

  try {
    const blob = await fetchBlob(`/documents/${props.documentId}/download`)
    downloadBlob(blob)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'Download failed'
  } finally {
    downloading.value = false
  }
}

const handlePreview = async () => {
  error.value = ''
  previewing.value = true

  try {
    const blob = await fetchBlob(`/documents/${props.documentId}/preview`)
    const url = createBlobUrl(blob)
    window.open(url, '_blank')
    setTimeout(() => window.URL.revokeObjectURL(url), 10000)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || 'Preview failed'
  } finally {
    previewing.value = false
  }
}

const isPdf = props.mimeType?.toLowerCase().startsWith('application/pdf')
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <button
        type="button"
        @click="handleDownload"
        :disabled="downloading"
        class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span class="text-slate-400">⬇️</span>
        <span>{{ downloading ? 'Downloading…' : 'Download' }}</span>
      </button>

      <button
        v-if="isPdf"
        type="button"
        @click="handlePreview"
        :disabled="previewing"
        class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span class="text-slate-400">👁️</span>
        <span>{{ previewing ? 'Opening…' : 'Preview' }}</span>
      </button>
    </div>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
  </div>
</template>
