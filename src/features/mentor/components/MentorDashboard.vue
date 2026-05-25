<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getMentorships, updateApplicationStatusByMentor, deleteMentorshipByMentor } from '../api/mentorships'
import type { Mentorship } from '../types/mentorships'

import MentorshipsTable from './MentorshipsTable.vue'
import ProjectDetail from './ProjectDetail.vue'

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
    error.value = 'Unable to load projects.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Separate requests (onboarding status) from active mentorships
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

// Accept onboarding application request
const handleAcceptRequest = async (mentorship: Mentorship) => {
  error.value = ''
  successMessage.value = ''
  try {
    await updateApplicationStatusByMentor(mentorship.application.id, 'active')
    successMessage.value = 'Mentorship request successfully accepted!'
    await fetchMentorships()
    setTimeout(() => (successMessage.value = ''), 4000)
  } catch (err: any) {
    error.value = err.response?.data?.message ?? 'Failed to accept mentorship request.'
  }
}

// Reject onboarding application request (remove mentor and set app back to approved)
const handleRejectRequest = async (mentorship: Mentorship) => {
  if (!confirm('Are you sure you want to reject this mentorship request?')) return
  error.value = ''
  successMessage.value = ''
  try {
    // 1. Move status back to approved
    await updateApplicationStatusByMentor(mentorship.application.id, 'approved')
    // 2. Detach mentor from the application
    await deleteMentorshipByMentor(mentorship.id)
    
    successMessage.value = 'Mentorship request rejected.'
    await fetchMentorships()
    setTimeout(() => (successMessage.value = ''), 4000)
  } catch (err: any) {
    error.value = err.response?.data?.message ?? 'Failed to reject mentorship request.'
  }
}

onMounted(() => {
  fetchMentorships()
})
</script>

<template>
  <div class="p-6 bg-slate-950 min-h-screen text-slate-100">
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-3xl font-bold text-white">Mentor Administration</h2>
      </div>

      <div class="flex flex-wrap gap-2 border-b border-slate-800">
        <button
          @click="activeTab = 'overview'"
          :class="[activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']"
        >
          Quick Actions
        </button>
        <button
          @click="activeTab = 'requests'; fetchMentorships()"
          :class="[activeTab === 'requests' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']"
        >
          New Requests ({{ mentorshipRequests.length }})
        </button>
        <button
          @click="activeTab = 'mentorships'; fetchMentorships()"
          :class="[activeTab === 'mentorships' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']"
        >
          My Projects ({{ activeMentorships.length }})
        </button>
        <button
          v-if="activeTab === 'project-detail'"
          class="border-b-2 border-emerald-500 text-emerald-400 px-4 py-2 text-sm font-medium"
        >
          Application details: {{ selectedMentorship?.application?.team?.name || 'Details' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-xl">
      ⚠️ {{ error }}
    </div>
    <div v-if="successMessage" class="mb-4 p-4 bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-sm rounded-xl">
      ✅ {{ successMessage }}
    </div>

    <div v-show="activeTab === 'overview'" class="space-y-6">
      <div class="flex gap-4 flex-wrap">
        <router-link to="/mentor-profile"
                     class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition">
          My Profile
        </router-link>
        <button @click="activeTab = 'requests'; fetchMentorships()" class="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition flex items-center gap-2">
          Review Requests <span class="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">{{ mentorshipRequests.length }}</span>
        </button>
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