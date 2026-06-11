<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/features/auth/stores/auth'
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  uploadMilestoneDocument,
  downloadMilestoneDocument,
} from '@/features/milestones/api/milestones'

const props = defineProps<{ applicationId: number | string, applicationStatus: string }>()

const { t, locale } = useI18n()
const auth = useAuthStore()
const canManage = auth.isAdmin || auth.role === 'mentor'

const milestones = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const success = ref('')

const showForm = ref(false)
const creating = ref(false)
const form = ref({ title: '', due_date: '', description: '' })

const uploadingId = ref<number | null>(null)

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-800 border-slate-700 text-slate-400',
  in_progress: 'bg-blue-900/30 border-blue-800 text-blue-400',
  completed: 'bg-green-900/30 border-green-800 text-green-400',
  overdue: 'bg-red-900/30 border-red-800 text-red-400',
}

onMounted(load)

async function load() {
  loading.value = true
  try {
    const res = await getMilestones(props.applicationId)
    milestones.value = res.data?.data ?? res.data ?? []
  } catch {
    error.value = t('milestones.errors.loadFailed')
  } finally {
    loading.value = false
  }
}

async function create() {
  creating.value = true
  error.value = ''
  try {
    await createMilestone(props.applicationId, form.value)
    form.value = { title: '', due_date: '', description: '' }
    showForm.value = false
    success.value = t('milestones.success.created')
    setTimeout(() => (success.value = ''), 3000)
    await load()
  } catch (e: any) {
    error.value = e.response?.data?.message ?? t('milestones.errors.createFailed')
  } finally {
    creating.value = false
  }
}

async function changeStatus(id: number, status: string) {
  try {
    await updateMilestone(id, { status: status as any })
    const m = milestones.value.find(m => m.id === id)
    if (m) m.status = status
  } catch (e: any) {
    error.value = e.response?.data?.message ?? t('milestones.errors.updateFailed')
  }
}

async function uploadDoc(id: number, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingId.value = id
  const fd = new FormData()
  fd.append('file', file)
  try {
    await uploadMilestoneDocument(id, fd)
    success.value = t('milestones.success.uploaded')
    setTimeout(() => (success.value = ''), 3000)
    await load()
  } catch (e: any) {
    error.value = e.response?.data?.message ?? t('milestones.errors.uploadFailed')
  } finally {
    uploadingId.value = null
  }
}

async function downloadDoc(milestoneId: number, documentId: number, fileName: string) {
  try {
    const res = await downloadMilestoneDocument(milestoneId, documentId)
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    error.value = t('milestones.errors.downloadFailed')
  }
}
</script>

<template>
  <div class="border border-slate-800 rounded-xl p-6 bg-slate-900/30 mb-4">
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs font-semibold tracking-widest uppercase text-blue-500">
        {{ t('milestones.heading') }}
      </div>
      <button
        v-if="canManage && applicationStatus == 'active'"
        @click="showForm = !showForm"
        class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
      >
        {{ showForm ? t('milestones.btnCancel') : t('milestones.btnAddMilestone') }}
      </button>
    </div>

    <p v-if="error" class="text-red-400 text-sm mb-3">{{ error }}</p>
    <p v-if="success" class="text-green-400 text-sm mb-3">{{ success }}</p>

    <div v-if="showForm && canManage" class="border border-slate-700 rounded-lg p-4 bg-slate-950/40 mb-4 flex flex-col gap-3">
      <input
        v-model="form.title"
        type="text"
        :placeholder="t('milestones.placeholderTitle')"
        class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 outline-none"
      />
      <input
        v-model="form.due_date"
        type="date"
        class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-600 outline-none"
      />
      <textarea
        v-model="form.description"
        rows="3"
        :placeholder="t('milestones.placeholderDescription')"
        class="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 outline-none resize-none"
      />
      <button
        @click="create"
        :disabled="creating || !form.title || !form.due_date"
        class="self-start bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
      >
        {{ creating ? t('milestones.btnSaving') : t('milestones.btnSaveMilestone') }}
      </button>
    </div>

    <div v-if="loading" class="text-slate-500 animate-pulse text-sm">{{ t('milestones.loading') }}</div>

    <div v-else-if="milestones.length === 0" class="text-slate-500 text-sm">{{ t('milestones.noMilestones') }}</div>

    <div v-else class="flex flex-col gap-3">
      <div
        v-for="m in milestones"
        :key="m.id"
        class="border border-slate-700 rounded-lg px-4 py-3 bg-slate-950/40"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-white text-sm font-medium">{{ m.title }}</p>
            <p v-if="m.description" class="text-slate-500 text-xs mt-0.5">{{ m.description }}</p>
            <p class="text-slate-600 text-xs mt-1">
              {{ m.due_date
                ? t('milestones.lblDue', { date: new Date(m.due_date).toLocaleDateString(locale === 'sk' ? 'sk-SK' : 'en-US') })
                : t('milestones.lblDueEmpty') }}
            </p>
          </div>
          <span :class="['text-[10px] px-2 py-1 rounded border font-mono uppercase whitespace-nowrap', STATUS_COLORS[m.status] ?? STATUS_COLORS.pending]">
            {{ t('milestones.status.' + m.status) }}
          </span>
        </div>

        <div v-if="canManage" class="flex items-center gap-2 mt-3 flex-wrap">
          <button
            v-for="s in ['pending', 'in_progress', 'completed', 'overdue']"
            :key="s"
            @click="changeStatus(m.id, s)"
            :disabled="m.status === s"
            class="text-[10px] px-2 py-1 rounded border font-mono uppercase border-slate-700 text-slate-400 hover:border-slate-500 disabled:opacity-30 transition"
          >
            {{ t('milestones.status.' + s) }}
          </button>
        </div>

        <div class="flex items-center justify-between mt-3">
          <div v-if="m.documents?.length" class="flex flex-col gap-1.5 flex-1">
            <div
              v-for="d in m.documents"
              :key="d.id"
              class="flex items-center gap-2"
            >
              <span class="text-xs text-slate-400 font-mono truncate">📎 {{ d.file_name }}</span>
              <button
                @click="downloadDoc(m.id, d.id, d.file_name)"
                class="text-[10px] text-blue-400 hover:text-blue-300 border border-blue-900 hover:border-blue-700 px-2 py-0.5 rounded transition whitespace-nowrap"
              >
                {{ t('milestones.btnDownload') }}
              </button>
            </div>
          </div>

          <label v-if="applicationStatus == 'active' && !canManage" class="ml-auto cursor-pointer text-xs text-blue-400 hover:text-blue-300 transition">
            {{ uploadingId === m.id ? t('milestones.btnUploading') : t('milestones.btnUploadDoc') }}
            <input
              type="file"
              class="hidden"
              @change="uploadDoc(m.id, $event)"
              :disabled="uploadingId !== null"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>