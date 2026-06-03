<script setup lang="ts">
import { ref, defineAsyncComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/features/auth/stores/auth'

const { t } = useI18n()
const StudentInvitations = defineAsyncComponent(() => import('@/features/student/components/StudentInvitations.vue'))
const StudentApplications = defineAsyncComponent(() => import('@/features/student/components/StudentApplications.vue'))
const TeamsList = defineAsyncComponent(() => import('./TeamsList.vue'))

const auth = useAuthStore()

defineProps<{
  userRole?: string
}>()

const activeTab = ref('overview')
const currentUserId = ref(auth.user.id) 

const teamsListRef = ref<InstanceType<typeof TeamsList> | null>(null)

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
          <div class="w-full h-1 rounded-full bg-slate-800 overflow-hidden mt-6">
            <div class="w-1/3 h-full bg-blue-600 rounded-full"></div>
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