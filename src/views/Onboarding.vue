<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api/axios'

const router = useRouter()
const auth = useAuthStore()
const step = ref(1)
const error = ref('')
const loading = ref(false)

// Step 1 — Profile
const university = ref('')
const studyProgram = ref('')
const yearOfStudy = ref<number | null>(null)
const bio = ref('')
const githubUrl = ref('')

// Step 2 — Skills
type Skill = { skill: string; level: 'beginner' | 'intermediate' | 'advanced' }
const skills = ref<Skill[]>([{ skill: '', level: 'beginner' }])

function addSkill() {
  skills.value.push({ skill: '', level: 'beginner' })
}

function removeSkill(i: number) {
  skills.value.splice(i, 1)
}

// Step 3 — GDPR
const gdprConsent = ref(false)
const academicDeclaration = ref(false)

onMounted(() => {
  if (!auth.isLoggedIn) router.push('/auth/login')
})

function nextStep() {
  error.value = ''
  if (step.value === 1) {
    if (!university.value.trim())   { error.value = 'University is required'; return }
    if (!studyProgram.value.trim()) { error.value = 'Study program is required'; return }
    if (!yearOfStudy.value)         { error.value = 'Year of study is required'; return }
  }
  if (step.value === 2) {
    for (const s of skills.value) {
      if (!s.skill.trim()) { error.value = 'Fill in all skill names or remove empty ones'; return }
    }
  }
  step.value++
}

async function submit() {
  error.value = ''
  if (!gdprConsent.value)         { error.value = 'You must agree to data processing'; return }
  if (!academicDeclaration.value) { error.value = 'You must confirm the academic declaration'; return }

  loading.value = true
  try {
    await api.post('/onboarding', {
      university:                     university.value,
      study_program:                  studyProgram.value,
      year_of_study:                  yearOfStudy.value,
      bio:                            bio.value,
      github_url:                     githubUrl.value,
      skills:                         skills.value.filter(s => s.skill.trim()),
      gdpr_consent:                   true,
      academic_declaration_confirmed: true,
    })
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#080f1e] flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-xl">

      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-600/10 border border-blue-900 px-4 py-1.5 rounded-full mb-4">
          Welcome to NTI
        </div>
        <h1 class="font-bold text-4xl text-white mb-2">Complete your profile</h1>
        <p class="text-gray-500 text-sm">This takes about 2 minutes</p>
      </div>

      <!-- Step indicator -->
      <div class="flex items-center mb-10">
        <div class="flex flex-col items-center">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',
            step >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">1</div>
          <span class="text-xs mt-1.5" :class="step >= 1 ? 'text-blue-400' : 'text-gray-600'">Profile</span>
        </div>
        <div class="flex-1 h-px mx-2 mb-4" :class="step >= 2 ? 'bg-blue-600' : 'bg-blue-900'"></div>
        <div class="flex flex-col items-center">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',
            step >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">2</div>
          <span class="text-xs mt-1.5" :class="step >= 2 ? 'text-blue-400' : 'text-gray-600'">Skills</span>
        </div>
        <div class="flex-1 h-px mx-2 mb-4" :class="step >= 3 ? 'bg-blue-600' : 'bg-blue-900'"></div>
        <div class="flex flex-col items-center">
          <div :class="['flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',
            step >= 3 ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-900 text-gray-500']">3</div>
          <span class="text-xs mt-1.5" :class="step >= 3 ? 'text-blue-400' : 'text-gray-600'">Consent</span>
        </div>
      </div>

      <p v-if="error" class="text-red-400 text-sm mb-4">{{ error }}</p>

      <!-- STEP 1 — Profile -->
      <div v-if="step === 1" class="flex flex-col gap-4">
        <div>
          <label class="block text-white text-sm mb-1">University <span class="text-red-400">*</span></label>
          <input v-model="university" type="text" placeholder="e.g. UKF Nitra"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-white text-sm mb-1">Study program <span class="text-red-400">*</span></label>
          <input v-model="studyProgram" type="text" placeholder="e.g. Applied Informatics"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-white text-sm mb-1">Year of study <span class="text-red-400">*</span></label>
          <select v-model="yearOfStudy"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white focus:outline-none focus:border-blue-500">
            <option :value="null" disabled class="bg-[#080f1e]">Select year</option>
            <option v-for="y in [1,2,3,4,5,6]" :key="y" :value="y" class="bg-[#080f1e]">{{ y }}. year</option>
          </select>
        </div>
        <div>
          <label class="block text-white text-sm mb-1">Bio</label>
          <textarea v-model="bio" rows="3" placeholder="Tell us a bit about yourself..."
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"></textarea>
        </div>
        <div>
          <label class="block text-white text-sm mb-1">GitHub URL</label>
          <input v-model="githubUrl" type="url" placeholder="https://github.com/username"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
        </div>
        <button @click="nextStep"
          class="bg-blue-600 hover:bg-blue-500 text-white w-full h-10 mt-2 rounded-md text-sm font-medium cursor-pointer transition">
          Continue to Skills →
        </button>
      </div>

      <!-- STEP 2 — Skills -->
      <div v-else-if="step === 2" class="flex flex-col gap-4">
        <p class="text-gray-400 text-sm">Add your technical skills. You can skip this and add them later.</p>

        <div v-for="(s, i) in skills" :key="i" class="flex gap-2 items-center">
          <input v-model="s.skill" type="text" placeholder="e.g. Vue.js"
            class="bg-blue-600/10 border border-blue-900 rounded-md h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 flex-1" />
          <select v-model="s.level"
            class="bg-blue-600/10 border border-blue-900 rounded-md h-9 px-3 text-white focus:outline-none focus:border-blue-500 w-36">
            <option value="beginner" class="bg-[#080f1e]">Beginner</option>
            <option value="intermediate" class="bg-[#080f1e]">Intermediate</option>
            <option value="advanced" class="bg-[#080f1e]">Advanced</option>
          </select>
          <button @click="removeSkill(i)" type="button"
            class="text-slate-600 hover:text-red-400 text-lg transition px-1">×</button>
        </div>

        <button @click="addSkill" type="button"
          class="border border-dashed border-slate-700 hover:border-blue-700 text-slate-500 hover:text-blue-400 w-full h-9 rounded-md text-sm transition">
          + Add skill
        </button>

        <div class="flex gap-3 mt-2">
          <button @click="step = 1"
            class="border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white w-1/3 h-10 rounded-md text-sm cursor-pointer transition">
            ← Back
          </button>
          <button @click="nextStep"
            class="bg-blue-600 hover:bg-blue-500 text-white flex-1 h-10 rounded-md text-sm font-medium cursor-pointer transition">
            Continue to Consent →
          </button>
        </div>
      </div>

      <!-- STEP 3 — GDPR & Consent -->
      <div v-else class="flex flex-col gap-4">
        <p class="text-gray-400 text-sm">Please read and confirm the following before proceeding.</p>

        <div class="bg-blue-600/10 border border-blue-900 rounded-md p-4">
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="gdprConsent" type="checkbox" class="mt-0.5 accent-blue-500" />
            <span class="text-sm text-gray-300">
              I agree to the processing of my personal data by NTI for the purpose of program administration, communication and reporting, in accordance with GDPR regulations.
            </span>
          </label>
        </div>

        <div class="bg-blue-600/10 border border-blue-900 rounded-md p-4">
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="academicDeclaration" type="checkbox" class="mt-0.5 accent-blue-500" />
            <span class="text-sm text-gray-300">
              I declare that I have no carried-over courses and my average grade of core courses meets the required threshold. I understand this will be verified by the committee.
            </span>
          </label>
        </div>

        <div class="flex gap-3 mt-2">
          <button @click="step = 2"
            class="border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white w-1/3 h-10 rounded-md text-sm cursor-pointer transition">
            ← Back
          </button>
          <button @click="submit" :disabled="loading"
            class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex-1 h-10 rounded-md text-sm font-medium cursor-pointer transition">
            {{ loading ? 'Saving...' : 'Complete Profile' }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>