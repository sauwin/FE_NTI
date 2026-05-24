<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { mentorshipsApi, type Mentorship } from '../api/mentorships'

import MentorshipsTable from './MentorshipsTable.vue'
import ProjectDetail from './ProjectDetail.vue'

const activeTab = ref('overview')
const mentorships = ref<Mentorship[]>([])
const loading = ref(false)
const error = ref('')

const selectedMentorship = ref<Mentorship | null>(null)

const fetchMentorships = async () => {
  loading.value = true
  error.value = ''
  try {
    mentorships.value = await mentorshipsApi.getMentorships()
  } catch (err: any) {
    error.value = 'Unable to load projects.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleViewProject = (mentorship: Mentorship) => {
  selectedMentorship.value = mentorship
  activeTab.value = 'project-detail'
}

const handleBackToList = () => {
  selectedMentorship.value = null
  activeTab.value = 'mentorships'
  fetchMentorships()
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
          Overview
        </button>
        <button
          @click="activeTab = 'mentorships'; fetchMentorships()"
          :class="[activeTab === 'mentorships' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-400', 'px-4 py-2 text-sm font-medium transition']"
        >
          Mentorships ({{ mentorships.length }})
        </button>
        <button
          v-if="activeTab === 'project-detail'"
          class="border-b-2 border-emerald-500 text-emerald-400 px-4 py-2 text-sm font-medium"
        >
          Деталі: {{ selectedMentorship?.application?.team?.name }}
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'overview'" class="space-y-6">
      <div class="flex gap-4 flex-wrap">
        <router-link to="/mentor-profile"
                     class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition">
          My Profile
        </router-link>
        <button @click="activeTab = 'mentorships'; fetchMentorships()" class="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition">
          Show
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'mentorships'">
      <MentorshipsTable 
        :mentorships="mentorships" 
        :loading="loading" 
        :error="error" 
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