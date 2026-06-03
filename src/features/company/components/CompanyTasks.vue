<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCompanyTasks } from '@/features/company/api/company'
import type { CompanyTask, TaskStatus } from '@/features/company/types/company'
import { updateTaskStatus, deleteCallWithTask } from '@/features/tasks/api/tasks'
import { useConfirm as confirm } from '../../../shared/composables/useConfirm'

const router = useRouter()
const { t, locale } = useI18n()

const tasks = ref<CompanyTask[]>([])
const loading = ref(false)
const actionLoading = ref<number | null>(null) 

onMounted(async () => {
  await fetchTasks()
})

async function fetchTasks() {
  loading.value = true
  try {
    const response = await getCompanyTasks()
    tasks.value = Array.isArray(response.data) ? response.data : (response.data?.data ?? [])
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

function getStatusColor(status: TaskStatus) {
  const colors: Record<TaskStatus, string> = {
    draft: 'bg-slate-800/40 text-slate-400 border-slate-700/60',
    published: 'bg-blue-600/15 text-blue-400 border-blue-900/40',
    in_matching: 'bg-amber-950/40 text-amber-400 border-amber-900/40',
    assigned: 'bg-purple-950/40 text-purple-400 border-purple-900/40',
    in_progress: 'bg-cyan-950/40 text-cyan-400 border-cyan-900/40',
    closed: 'bg-slate-900 text-slate-500 border-slate-800',
  }
  return colors[status]
}

const viewDetails = (taskId: number) => {
  router.push(`/programs/b/tasks/${taskId}`)
}

async function handlePublishTask(task: CompanyTask) {
  actionLoading.value = task.id
  try {
    await updateTaskStatus(task.id, 'published')
    await fetchTasks()
  } catch (err) {
    console.error('Failed to publish task', err)
  } finally {
    actionLoading.value = null
  }
}

async function handleDeleteTask(task: CompanyTask) {
  const isConfirmed = await confirm({
    title: t('company.tasks.confirmDeleteTitle'),
    message: t('company.tasks.confirmDeleteMsg', { title: task.title }),
    danger: true
  })

  if (!isConfirmed) return

  actionLoading.value = task.id
  try {
    await deleteCallWithTask(task.id)
    await fetchTasks()
  } catch (err) {
    console.error('Failed to delete task', err)
  } finally {
    actionLoading.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-900 pb-5 gap-4">
      <div>
        <h3 class="text-xl font-bold text-white">{{ t('company.tasks.title') }}</h3>
        <p class="text-xs text-slate-500 mt-1">{{ t('company.tasks.subtitle') }}</p>
      </div>
      <router-link
        to="/programs/b/create-task"
        class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-medium transition shadow-sm shadow-blue-900/20 text-center shrink-0"
      >
        {{ t('company.tasks.createBtn') }}
      </router-link>
    </div>

    <div v-if="loading" class="space-y-4 animate-pulse">
      <div v-for="n in 3" :key="n" class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50">
        <div class="flex justify-between items-start mb-3">
          <div class="h-5 bg-slate-800 rounded w-1/3"></div>
          <div class="h-5 bg-slate-800 rounded w-16"></div>
        </div>
        <div class="h-4 bg-slate-950/60 rounded w-2/3 mb-4"></div>
        <div class="border-t border-slate-950 pt-4 grid grid-cols-3 gap-4">
          <div class="h-8 bg-slate-950/40 rounded"></div>
          <div class="h-8 bg-slate-950/40 rounded"></div>
          <div class="h-8 bg-slate-950/40 rounded"></div>
        </div>
      </div>
    </div>

    <div v-else-if="tasks.length === 0" class="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
      <p class="text-sm text-slate-500">{{ t('company.tasks.noTasks') }}</p>
      <router-link to="/programs/b/create-task" class="text-blue-400 hover:text-blue-300 text-xs mt-2 inline-block font-medium transition">
        {{ t('company.tasks.postFirst') }} &rarr;
      </router-link>
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="task in tasks"
        :key="task.id"
        @click="viewDetails(task.id)"
        class="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition cursor-pointer group relative"
      >
        <div class="flex justify-between items-start gap-4 mb-4">
          <div class="space-y-1.5">
            <h4 class="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
              {{ task.title }}
            </h4>
            <p class="text-xs text-slate-400 line-clamp-2 max-w-3xl leading-relaxed">
              {{ task.short_description || task.brief || t('company.tasks.noDesc') }}
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0" @click.stop>
            <button
              v-if="task.status === 'draft'"
              @click="handlePublishTask(task)"
              :disabled="actionLoading === task.id"
              class="text-[10px] bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 hover:border-blue-500 text-blue-400 hover:text-white px-2.5 py-1 rounded-xl transition font-mono font-semibold uppercase tracking-wider"
            >
              {{ actionLoading === task.id ? '...' : t('company.tasks.publish') }}
            </button>

            <span :class="['text-[10px] px-2.5 py-1 rounded-xl border uppercase font-mono font-semibold tracking-wider', getStatusColor(task.status)]">
              {{ task.status.replace('_', ' ') }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-950 text-xs">
          <div>
            <span class="text-slate-500 block font-mono uppercase text-[10px] tracking-wider mb-1">{{ t('company.tasks.budget') }}</span>
            <p class="text-slate-300 font-medium">
              {{ task.budget ? `€${Number(task.budget).toLocaleString()}` : t('company.tasks.notSpecified') }}
            </p>
          </div>
          <div>
            <span class="text-slate-500 block font-mono uppercase text-[10px] tracking-wider mb-1">{{ t('company.tasks.program') }}</span>
            <p class="text-slate-300 font-medium font-mono uppercase tracking-wider">
              {{ (task.call as any)?.program?.code ? (task.call as any).program.code.replace('program_', 'Program ') : 'B' }}
            </p>
          </div>
          <div>
            <span class="text-slate-500 block font-mono uppercase text-[10px] tracking-wider mb-1">{{ t('company.common.created') }}</span>
            <p class="text-slate-300 font-medium font-mono">
              {{ task.created_at ? new Date(task.created_at).toLocaleDateString(locale === 'sk' ? 'sk-SK' : 'en-US') : '—' }}
            </p>
          </div>
          
          <div class="text-right flex items-center justify-end gap-5 text-xs" @click.stop>
            <button
              @click="handleDeleteTask(task)"
              :disabled="actionLoading === task.id"
              class="text-red-400/70 hover:text-red-400 border-b border-transparent hover:border-red-500/40 font-mono transition text-[11px]"
            >
              {{ actionLoading === task.id ? t('company.tasks.deleting') : t('company.common.delete') }}
            </button>

            <router-link
              :to="`/programs/b/tasks/${task.id}/edit`"
              class="text-slate-400 hover:text-white border-b border-transparent hover:border-slate-500 transition font-medium pb-0.5"
            >
              {{ t('company.common.edit') }}
            </router-link>
            <button
              @click="viewDetails(task.id)"
              class="text-blue-400 hover:text-blue-300 font-bold transition flex items-center gap-1"
            >
              <span>TS</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>