<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getOrganizationApplications, updateApplicationStatus } from '@/features/company/api/company'

interface ApplicationItem {
  id: number
  status: string
  created_at: string
  team?: {
    id: number
    name: string
  } | null
  student_profile?: {
    user?: {
      name: string
      email: string
    }
  } | null
  call?: {
    id: number
    name: string
    task?: {
      id: number
      title: string
    }
  } | null
}

const router = useRouter()
const { t, locale } = useI18n()

const applications = ref<ApplicationItem[]>([])
const loading = ref(false)
const actionLoading = ref<number | null>(null)

const showRevisionModal = ref(false)
const revisionAppId = ref<number | null>(null)
const revisionMessage = ref('')
const revisionLoading = ref(false)

onMounted(async () => {
  await fetchApplications()
})

async function fetchApplications() {
  loading.value = true
  try {
    const res = await getOrganizationApplications()
    applications.value = Array.isArray(res.data) ? res.data : (res.data?.data ?? [])
  } catch (err) {
    console.error('Failed to load applications:', err)
    applications.value = []
  } finally {
    loading.value = false
  }
}

async function handleVerify(appId: number) {
  actionLoading.value = appId
  try {
    await updateApplicationStatus(appId, 'formally_verified', 'Application successfully verified by organization owner.')
    await fetchApplications()
  } catch (err) {
    console.error('Verification failed:', err)
  } finally {
    actionLoading.value = null
  }
}

function openRevisionModal(appId: number) {
  revisionAppId.value = appId
  revisionMessage.value = ''
  showRevisionModal.value = true
}

async function submitRevision() {
  if (!revisionAppId.value || !revisionMessage.value.trim()) return
  
  revisionLoading.value = true
  try {
    await updateApplicationStatus(revisionAppId.value, 'pending_revision', revisionMessage.value.trim())
    showRevisionModal.value = false
    await fetchApplications()
  } catch (err) {
    console.error('Revision request failed:', err)
  } finally {
    revisionLoading.value = false
    revisionAppId.value = null
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    draft: 'bg-slate-800/40 text-slate-400 border-slate-700/60',
    submitted: 'bg-amber-600/15 text-amber-400 border-amber-900/40',
    formally_verified: 'bg-blue-600/15 text-blue-400 border-blue-900/40',
    under_evaluation: 'bg-purple-600/15 text-purple-400 border-purple-900/40',
    pending_revision: 'bg-rose-600/15 text-rose-400 border-rose-900/40',
    approved: 'bg-emerald-600/15 text-emerald-400 border-emerald-900/40',
    rejected: 'bg-slate-900 text-slate-500 border-slate-800',
    active: 'bg-cyan-600/15 text-cyan-400 border-cyan-900/40',
  }
  return colors[status] || 'bg-slate-800 text-slate-400 border-slate-700'
}

function viewApplicationDetails(id: number) {
  router.push(`/applications/${id}`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="border-b border-slate-900 pb-5">
      <h3 class="text-xl font-bold text-white">{{ t('company.applications.title') }}</h3>
      <p class="text-xs text-slate-500 mt-1">
        {{ t('company.applications.subtitle') }}
      </p>
    </div>

    <div v-if="loading" class="space-y-3 animate-pulse">
      <div v-for="n in 4" :key="n" class="h-16 bg-slate-900/40 border border-slate-800/60 rounded-xl"></div>
    </div>

    <div v-else-if="applications.length === 0" class="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
      <p class="text-sm text-slate-500">{{ t('company.applications.noApplications') }}</p>
    </div>

    <div v-else class="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/10">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-800 bg-slate-950/40 text-[11px] font-mono uppercase tracking-wider text-slate-500">
            <th class="py-4 px-5">{{ t('company.applications.idApplicant') }}</th>
            <th class="py-4 px-5">{{ t('company.applications.targetCall') }}</th>
            <th class="py-4 px-5">{{ t('company.common.status') }}</th>
            <th class="py-4 px-5">{{ t('company.applications.submittedAt') }}</th>
            <th class="py-4 px-5 text-right">{{ t('company.common.actions') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60 text-sm">
          <tr 
            v-for="app in applications" 
            :key="app.id"
            class="hover:bg-slate-900/30 group"
          >
            <td class="py-4 px-5">
              <div class="font-semibold text-white">
                {{ app.team?.name ?? app.student_profile?.user?.name ?? t('company.applications.individualSolver') }}
              </div>
              <div class="text-xs text-slate-500 mt-0.5">
                ID: #{{ app.id }} • {{ app.student_profile?.user?.email ?? t('company.applications.noEmail') }}
              </div>
            </td>

            <td class="py-4 px-5 max-w-xs truncate">
              <span class="text-slate-300 block font-medium truncate">
                {{ app.call?.name ?? '—'  }}
              </span>
            </td>

            <td class="py-4 px-5">
              <span :class="['text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-semibold uppercase tracking-wider', getStatusColor(app.status)]">
                {{ app.status.replace('_', ' ') }}
              </span>
            </td>

            <td class="py-4 px-5 text-xs text-slate-400 font-mono">
              {{ app.created_at ? new Date(app.created_at).toLocaleDateString(locale === 'sk' ? 'sk-SK' : 'en-US') : '—' }}
            </td>

            <td class="py-4 px-5 text-right" @click.stop>
              <div class="flex items-center justify-end gap-2">
                
                <template v-if="app.status === 'submitted'">
                  <button
                    @click="viewApplicationDetails(app.id)"
                    :disabled="actionLoading === app.id"
                    class="text-xs bg-slate-800 hover:bg-slate-600 border border-slate-700 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer"
                  >
                    {{ t('company.applications.details') }}
                  </button>
                  <button
                    @click="openRevisionModal(app.id)"
                    :disabled="actionLoading === app.id"
                    class="text-xs bg-slate-800 hover:bg-rose-950/40 border border-slate-700 text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer"
                  >
                    {{ t('company.applications.revision') }}
                  </button>
                  <button
                    @click="handleVerify(app.id)"
                    :disabled="actionLoading === app.id"
                    class="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition font-medium shadow-sm shadow-blue-900/30 cursor-pointer"
                  >
                    {{ actionLoading === app.id ? '...' : t('company.applications.verify') }}
                  </button>
                </template>

                <button
                  v-else
                  @click="viewApplicationDetails(app.id)"
                  class="text-xs text-slate-400 hover:text-white bg-slate-950/40 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg transition font-mono"
                >
                  {{ t('company.common.view') }} &rarr;
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showRevisionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
        <h3 class="text-base font-bold text-white mb-2">{{ t('company.applications.modalTitle', { id: revisionAppId }) }}</h3>
        <p class="text-slate-400 text-xs mb-4">
          {{ t('company.applications.modalDesc') }}
        </p>
        
        <textarea
          v-model="revisionMessage"
          rows="4"
          :placeholder="t('company.applications.modalPlaceholder')"
          class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 outline-none transition-all resize-none"
        ></textarea>

        <div class="flex justify-end gap-3 mt-5">
          <button
            @click="showRevisionModal = false"
            :disabled="revisionLoading"
            class="px-4 py-2 text-xs border border-slate-800 text-slate-400 hover:text-white rounded-lg transition font-mono cursor-pointer"
          >
            {{ t('company.common.cancel') }}
          </button>
          <button
            @click="submitRevision"
            :disabled="revisionLoading || !revisionMessage.trim()"
            class="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition font-semibold font-mono cursor-pointer"
          >
            {{ revisionLoading ? t('company.applications.sending') : t('company.applications.sendToRevision') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>