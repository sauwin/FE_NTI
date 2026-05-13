<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const error = ref('')
const loading = ref(false)

const studyProgram = ref('')
const yearOfStudy = ref(1)
const university = ref('')
const bio = ref('')
const githubUrl = ref('')
const academicDeclaration = ref(false)

async function submit() {
  error.value = ''
  if (!academicDeclaration.value) {
    error.value = 'You must confirm the academic declaration'
    return
  }
  loading.value = true
  try {
    await api.post('/profile/student', {
      study_program:                  studyProgram.value,
      year_of_study:                  yearOfStudy.value,
      university:                     university.value,
      bio:                            bio.value,
      github_url:                     githubUrl.value,
      academic_declaration_confirmed: academicDeclaration.value,
    })
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Failed to save profile'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex justify-center px-4 py-12">
    <div class="w-full max-w-xl">
      <div class="mb-8 text-center">
        <h1 class="font-bold text-4xl text-white">Complete your profile</h1>
        <p class="text-gray-400 mt-2 text-sm">This information helps NTI evaluate your application.</p>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

        <div>
          <label class="block text-white text-sm mb-1">Study program <span class="text-red-400">*</span></label>
          <input v-model="studyProgram" type="text" placeholder="e.g. Applied Informatics"
                 class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label class="block text-white text-sm mb-1">Year of study <span class="text-red-400">*</span></label>
          <select v-model="yearOfStudy"
                  class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-9 px-3 text-white focus:outline-none focus:border-blue-500">
            <option v-for="y in 6" :key="y" :value="y" class="bg-[#080f1e]">Year {{ y }}</option>
          </select>
        </div>

        <div>
          <label class="block text-white text-sm mb-1">University</label>
          <input v-model="university" type="text" placeholder="e.g. UKF Nitra"
                 class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label class="block text-white text-sm mb-1">Bio</label>
          <textarea v-model="bio" rows="3" placeholder="Tell us about yourself..."
                    class="bg-blue-600/10 border border-blue-900 rounded-md w-full px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"></textarea>
        </div>

        <div>
          <label class="block text-white text-sm mb-1">GitHub URL</label>
          <input v-model="githubUrl" type="url" placeholder="https://github.com/username"
                 class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        </div>

        <div class="bg-blue-600/10 border border-blue-900 rounded-md p-4">
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="academicDeclaration" type="checkbox" class="mt-0.5 accent-blue-500" />
            <span class="text-sm text-gray-300">
              I declare that I have no carried-over courses and my average grade of core courses meets the required threshold.
            </span>
          </label>
        </div>

        <button type="submit" :disabled="loading"
                class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-full h-10 mt-2 rounded-md text-sm font-medium cursor-pointer">
          {{ loading ? 'Saving...' : 'Save and continue' }}
        </button>
      </form>
    </div>
  </div>
</template>