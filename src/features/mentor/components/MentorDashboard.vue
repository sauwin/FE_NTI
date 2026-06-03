<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMentorships, updateApplicationStatusByMentor, deleteMentorshipByMentor } from '../api/mentorships'
import type { Mentorship } from '../types/mentorships'

import MentorshipsTable from './MentorshipsTable.vue'
import ProjectDetail from './ProjectDetail.vue'
import { useConfirm } from "@/shared/composables/useConfirm.ts"

const { t } = useI18n()

const activeTab = ref('overview')
const mentorships = ref<Mentorship[]>([])
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const selectedMentorship = ref<Mentorship | null>(null)

const fetchMentorships = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getMentorships()
    mentorships.value = res.data
  } catch (err: any) {
    error.value = t('mentor.errors.loadFailed')
    console.error(err)
  } finally {
    loading.value = false
  }
}

const mentorshipRequests = computed(() => {
  return mentorships.value.filter(m => m.application?.status === 'onboarding')
})

const activeMentorships = computed(() => {
  return mentorships.value.filter(m => m.application?.status !== 'onboarding')
})

const handleViewProject = (mentorship: Mentorship) => {
  selectedMentorship.value = mentorship
  activeTab.value = 'project-detail'
}

const handleBackToList = () => {
  selectedMentorship.value = null
  activeTab.value = 'mentorships'
  fetchMentorships()
}

const handleAcceptRequest = async (mentorship: Mentorship) => {
  error.value = ''
  successMessage.value = ''
  try {
    await updateApplicationStatusByMentor(mentorship.application.id, 'active')
    successMessage.value = t('mentor.success.accepted')
    await fetchMentorships()
    setTimeout(() => (successMessage.value = ''), 4000)
  } catch (err: any) {
    error.value = err.response?.data?.message ?? t('mentor.errors.acceptFailed')
  }
}

const handleRejectRequest = async (mentorship: Mentorship) => {
  const confirmed = await useConfirm({
    title: t('mentor.confirm.rejectTitle'),
    message: t('mentor.confirm.rejectMessage'),
    confirmText: t('mentor.confirm.rejectBtn'),
    cancelText: t('mentor.confirm.cancelBtn'),
    danger: true,
  })
  if (!confirmed) return
  error.value = ''
  successMessage.value = ''
  try {
    await updateApplicationStatusByMentor(mentorship.application.id, 'approved')
    await deleteMentorshipByMentor(mentorship.id)
    
    successMessage.value = t('mentor.success.rejected')
    await fetchMentorships()
    setTimeout(() => (successMessage.value = ''), 4000)
  } catch (err: any) {
    error.value = err.response?.data?.message ?? t('mentor.errors.rejectFailed')
  }
}

onMounted(() => {
  fetchMentorships()
})
</script>

<template>
  <div class="p-6 bg-slate-950 min-h-screen text-slate-100">
    <div class="mb-8">
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
        <div>
          <h2 class="text-3xl font-bold text-white">{{ t('mentor.adminTitle') }}</h2>
          <p class="text-sm text-slate-500 mt-2">{{ t('mentor.adminSubtitle') }}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          @click="activeTab = 'overview'"
          :class="[
            activeTab === 'overview'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          {{ t('mentor.tabs.overview') }}
        </button>
        
        <button
          @click="activeTab = 'requests'; fetchMentorships()"
          :class="[
            activeTab === 'requests'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          {{ t('mentor.tabs.requests', { count: mentorshipRequests.length }) }}
        </button>
        
        <button
          @click="activeTab = 'mentorships'; fetchMentorships()"
          :class="[
            activeTab === 'mentorships'
              ? 'bg-blue-600/15 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
            'px-4 py-2 text-sm font-medium transition rounded-xl border'
          ]"
        >
          {{ t('mentor.tabs.projects', { count: activeMentorships.length }) }}
        </button>
        
        <button
          v-if="activeTab === 'project-detail'"
          class="bg-emerald-600/15 border-emerald-500 text-emerald-400 px-4 py-2 text-sm font-medium rounded-xl border"
        >
          {{ t('mentor.tabs.details', { name: selectedMentorship?.application?.team?.name || 'Details' }) }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
      {{ error }}
    </div>
    <div v-if="successMessage" class="mb-6 p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-emerald-400 text-sm">
      {{ successMessage }}
    </div>

    <div v-show="activeTab === 'overview'" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div 
          @click="activeTab = 'requests'; fetchMentorships()"
          class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 transition hover:border-slate-700 cursor-pointer group"
        >
          <div class="text-xs text-slate-500 uppercase font-mono mb-2 tracking-wider">{{ t('mentor.overview.pending') }}</div>
          <div class="flex items-baseline justify-between">
            <span class="text-4xl font-bold text-white font-mono group-hover:text-blue-400 transition-colors">
              {{ mentorshipRequests.length }}
            </span>
            <span class="text-xs text-blue-400 bg-blue-600/15 border border-blue-900/40 px-2.5 py-1 rounded-xl font-medium font-mono" v-html="t('mentor.overview.review')">
            </span>
          </div>
        </div>

        <div 
          @click="activeTab = 'mentorships'; fetchMentorships()"
          class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 transition hover:border-slate-700 cursor-pointer group"
        >
          <div class="text-xs text-slate-500 uppercase font-mono mb-2 tracking-wider">{{ t('mentor.overview.active') }}</div>
          <div class="flex items-baseline justify-between">
            <span class="text-4xl font-bold text-white font-mono group-hover:text-blue-400 transition-colors">
              {{ activeMentorships.length }}
            </span>
            <span class="text-xs text-slate-400 bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-xl font-medium font-mono">
              {{ t('mentor.overview.viewAll') }}
            </span>
          </div>
        </div>

        <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 transition hover:border-slate-700 flex flex-col justify-between">
          <div class="text-xs text-slate-500 uppercase font-mono mb-2 tracking-wider">{{ t('mentor.overview.identity') }}</div>
          <div class="flex justify-between items-center mt-2">
            <span class="text-sm text-slate-300 font-medium">{{ t('mentor.overview.profileConfig') }}</span>
            <router-link to="/mentor-profile"
               class="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition text-slate-300 font-medium font-mono">
              {{ t('mentor.overview.edit') }}
            </router-link>
          </div>
        </div>

      </div>
    </div>

    <div v-show="activeTab === 'requests'">
      <MentorshipsTable 
        :mentorships="mentorshipRequests" 
        :loading="loading" 
        :error="error" 
        :is-request-mode="true"
        @view-project="handleViewProject"
        @accept-request="handleAcceptRequest"
        @reject-request="handleRejectRequest"
      />
    </div>

    <div v-show="activeTab === 'mentorships'">
      <MentorshipsTable 
        :mentorships="activeMentorships" 
        :loading="loading" 
        :error="error" 
        :is-request-mode="false"
        @view-project="handleViewProject"
      />
    </div>

    <div v-if="activeTab === 'project-detail' && selectedMentorship">
      <ProjectDetail 
        :mentorship="selectedMentorship" 
        @back="handleBackToList"
      />
    </div>
  </div>
</template>