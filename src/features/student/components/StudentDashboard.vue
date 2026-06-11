<script setup lang="ts">
import { ref, defineAsyncComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/features/auth/stores/auth'
import { anonymizeStudentAccount } from '@/features/student/api/profile.ts'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const StudentInvitations = defineAsyncComponent(() => import('@/features/student/components/StudentInvitations.vue'))
const StudentApplications = defineAsyncComponent(() => import('@/features/student/components/StudentApplications.vue'))
const TeamsList = defineAsyncComponent(() => import('./TeamsList.vue'))

const auth = useAuthStore()
const router = useRouter()

defineProps<{
  userRole?: string
}>()

const activeTab = ref('overview')
const currentUserId = ref(auth.user.id) 

const teamsListRef = ref<InstanceType<typeof TeamsList> | null>(null)

const showAnonymizeModal = ref(false)
const confirmDeleteText = ref('')
const isAnonymizing = ref(false)

function quickCreateTeam() {
  activeTab.value = 'teams'
  setTimeout(() => {
    teamsListRef.value?.openForm()
  }, 50)
}

const tabsConfig = computed(() => [
  { id: 'overview', label: t('student.admin.tabs.overview') },
  { id: 'invitations', label: t('student.admin.tabs.invitations') },
  { id: 'teams', label: t('student.admin.tabs.teams') },
  { id: 'aplications', label: t('student.admin.tabs.applications') },
])

const isConfirmationValid = computed(() => confirmDeleteText.value === 'DELETE MY ACCOUNT')

async function handleAnonymize() {
  if (!isConfirmationValid.value) return
  
  isAnonymizing.value = true
  try {
    await anonymizeStudentAccount({confirm: confirmDeleteText.value})

    showAnonymizeModal.value = false
    auth.logout() 
    router.push('/')
  } catch (e) {
    console.error(e)
  } finally {
    isAnonymizing.value = false
  }
}

function openAnonymizeModal() {
  confirmDeleteText.value = ''
  showAnonymizeModal.value = true
}
</script>

<template>
  <div class="p-6 bg-slate-950 min-h-screen text-slate-100">
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h2 class="text-3xl font-bold text-white">{{ t('student.admin.title') }}</h2>
          <p class="text-sm text-slate-500 mt-2">{{ t('student.admin.description') }}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button 
          v-for="tab in tabsConfig"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            activeTab === tab.id
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'overview'" class="space-y-6">
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-white">{{ t('student.admin.quickActions') }}</h3>
            <p class="text-sm text-slate-500 mt-1">{{ t('student.admin.quickActionsDesc') }}</p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              @click="quickCreateTeam"
              class="flex flex-col justify-between text-left p-4 rounded-xl border border-blue-900/20 bg-blue-950/20 hover:border-blue-500 transition-all group"
            >
              <div class="text-sm font-semibold text-blue-400 mb-1 group-hover:text-blue-300 transition-colors">
                {{ t('student.admin.createTeam') }}
              </div>
              <div class="text-xs text-slate-400">{{ t('student.admin.createTeamDesc') }}</div>
            </button>

            <router-link 
              to="/programs/a"
              class="flex flex-col justify-between text-left p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all"
            >
              <div class="text-sm font-semibold text-white mb-1">{{ t('student.admin.applyProgA') }}</div>
              <div class="text-xs text-slate-400">{{ t('student.admin.applyProgADesc') }}</div>
            </router-link>

            <router-link 
              to="/programs/b"
              class="flex flex-col justify-between text-left p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all"
            >
              <div class="text-sm font-semibold text-white mb-1">{{ t('student.admin.applyProgB') }}</div>
              <div class="text-xs text-slate-400">{{ t('student.admin.applyProgBDesc') }}</div>
            </router-link>

            <router-link 
              to="/profile"
              class="flex flex-col justify-between text-left p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all"
            >
              <div class="text-sm font-semibold text-white mb-1">{{ t('student.admin.myProfile') }}</div>
              <div class="text-xs text-slate-400">{{ t('student.admin.myProfileDesc') }}</div>
            </router-link>
          </div>
        </div>

        <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <h3 class="text-lg font-semibold text-white">{{ t('student.admin.rulesTitle') }}</h3>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed space-y-2">
              {{ t('student.admin.rulesText', { count: 3 }) }}
            </p>
            <div class="mt-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-500 leading-relaxed">
              {{ t('student.admin.rulesTip') }}
            </div>
          </div>
        </div>
      </div>

      <!-- DANGER ZONE -->
      <div class="mt-12 bg-red-950/10 border border-red-900/30 rounded-xl p-6">
        <div class="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h3 class="text-red-400 font-semibold text-base mb-1">{{ t('student.dangerZone.label') }}</h3>
            <p class="text-slate-400 text-sm">
              {{ t('student.dangerZone.anonymizationDescription') }}
            </p>
          </div>
          <button @click="openAnonymizeModal"
            class="border border-red-900/60 bg-red-950/40 hover:bg-red-900/40 text-red-400 hover:text-red-300 px-5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap">
            {{ t('student.dangerZone.anonymizeButton') }}
          </button>
        </div>
      </div>

      <!-- MODAL WINDOW FOR CONFIRMATION -->
      <div v-if="showAnonymizeModal" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
          <h3 class="text-xl font-bold text-white mb-2">{{ t('student.dangerZone.areYouSure') }}</h3>
          
          <p class="text-slate-400 text-sm mb-4 leading-relaxed">
            {{ t('student.dangerZone.confirmDescription.firstPart') }}
            <span class="text-red-400 font-mono font-bold">DELETE MY ACCOUNT</span> {{ t('student.dangerZone.confirmDescription.secondPart') }}
          </p>

          <div class="mb-6">
            <input 
              v-model="confirmDeleteText" 
              type="text" 
              placeholder="DELETE MY ACCOUNT"
              class="w-full bg-slate-950 border border-slate-800 focus:border-red-500 text-white rounded-lg h-10 px-3 font-mono text-sm focus:outline-none transition"
            />
          </div>

          <div class="flex gap-3 justify-end">
            <button 
              @click="showAnonymizeModal = false" 
              :disabled="isAnonymizing"
              class="px-4 py-2 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition">
              {{ t('student.common.cancel') }}
            </button>
            <button 
              @click="handleAnonymize" 
              :disabled="!isConfirmationValid || isAnonymizing"
              class="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-600 text-white rounded-lg text-sm font-medium transition">
              {{ isAnonymizing ? t('student.dangerZone.confirmButtonLoadingMessage') : t('student.dangerZone.confirmButtonMessage') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'invitations'">
      <StudentInvitations />
    </div>

    <div v-if="activeTab === 'teams'">
      <TeamsList ref="teamsListRef" :current-user-id="currentUserId" />
    </div>

    <div v-if="activeTab === 'aplications'">
      <StudentApplications />
    </div>
  </div>
</template>