<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import { getStudentProfile, updateProfile } from '@/features/student/api/profile'
import type { Skill, StudentProfile } from '@/features/student/types/profile'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref(false)
const editMode = ref(false)

const profile = ref<StudentProfile>({
  university: '', study_program: '', year_of_study: null,
  bio: '', github_url: '', academic_declaration_confirmed: false, skills: [],
})

const isNew = ref(false)

onMounted(async () => {
  if (!auth.isLoggedIn) { router.push('/auth/login'); return }
  try {
    const res = await getStudentProfile()
    if (res.data) {
      profile.value = { ...res.data, skills: res.data.skills ?? [] }
    } else {
      isNew.value = true
      editMode.value = true
    }
  } catch {
    isNew.value = true
    editMode.value = true
  } finally {
    loading.value = false
  }
})

function addSkill() {
  profile.value.skills.push({ skill: '', level: 'beginner' })
}
function removeSkill(i: number) {
  profile.value.skills.splice(i, 1)
}

async function save() {
  error.value = ''
  if (!profile.value.university.trim()) { error.value = 'University is required'; return }
  if (!profile.value.study_program.trim()) { error.value = 'Study program is required'; return }
  if (!profile.value.year_of_study) { error.value = 'Year of study is required'; return }

  saving.value = true
  try {
    await updateProfile({
      ...profile.value,
      skills: profile.value.skills?.filter(s => s.skill.trim()) ?? [],
    })
    success.value = true
    editMode.value = false
    isNew.value = false
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

const levelColor: Record<string, string> = {
  beginner: 'text-slate-400 bg-slate-800/60 border-slate-700',
  intermediate: 'text-blue-400 bg-blue-900/30 border-blue-800',
  advanced: 'text-green-400 bg-green-900/30 border-green-800',
}
</script>

<template>
  <div class="bg-blue-950 absolute rounded-full h-96 w-96 -z-10 -right-20 -top-10 blur-sm"></div>

  <div v-if="loading" class="text-slate-500 text-sm">Loading...</div>

  <!-- Header -->
  <div v-else>
    <div class="mb-10 flex items-start justify-between gap-6">
      <div>
        <div class="inline-flex items-center bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-4">
          Student Profile
        </div>
        <h1 class="font-bold text-5xl leading-tight">
          My <span class="text-blue-400">Profile</span>
        </h1>
      </div>
      <div class="flex gap-3 pt-10">
        <button v-if="!editMode" @click="editMode = true"
          class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
          Edit Profile
        </button>
        <template v-else>
          <button v-if="!isNew" @click="editMode = false; error = ''"
            class="border border-slate-700 hover:border-slate-500 text-gray-400 hover:text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
            Cancel
          </button>
          <button @click="save" :disabled="saving"
            class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
            {{ saving ? 'Saving...' : (isNew ? 'Create Profile' : 'Save Changes') }}
          </button>
        </template>
      </div>
    </div>

    <!-- New profile notice -->
    <div v-if="isNew"
      class="border border-yellow-800/50 bg-yellow-900/10 rounded-xl px-6 py-4 mb-8">
      <div class="text-sm font-semibold text-yellow-400 mb-1">Profile not filled in yet</div>
      <div class="text-muted-sm">Fill in your profile before submitting an application</div>
    </div>

    <div v-if="success"
      class="border border-green-800/50 bg-green-900/10 rounded-xl px-6 py-3 mb-8">
      <span class="text-green-400 text-sm font-medium">Profile saved successfully</span>
    </div>
    <p v-if="error" class="text-red-400 text-sm mb-6">{{ error }}</p>

    <!-- VIEW MODE -->
    <div v-if="!editMode" class="flex flex-col gap-10">
      <section>
        <div class="section-label">Basic Info</div>
        <div class="grid grid-cols-2 gap-4">
          <div class="card">
            <div class="label-hint">University</div>
            <div class="text-white font-medium">{{ profile.university || '—' }}</div>
          </div>
          <div class="card">
            <div class="label-hint">Study Program</div>
            <div class="text-white font-medium">{{ profile.study_program || '—' }}</div>
          </div>
          <div class="card">
            <div class="label-hint">Year of Study</div>
            <div class="text-white font-medium">
              {{ profile.year_of_study ? `${profile.year_of_study}. year` : '—' }}
            </div>
          </div>
          <div class="card">
            <div class="label-hint">GitHub</div>
            <a v-if="profile.github_url" :href="profile.github_url" target="_blank"
              class="text-blue-400 hover:text-blue-300 text-sm transition break-all">
              {{ profile.github_url }}
            </a>
            <div v-else class="text-slate-500">—</div>
          </div>
        </div>
        <div v-if="profile.bio" class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mt-4">
          <div class="text-xs text-slate-500 uppercase tracking-wide mb-2">Bio</div>
          <div class="text-slate-300 text-sm leading-relaxed">{{ profile.bio }}</div>
        </div>
      </section>

      <section>
        <div class="section-label">Skills</div>
        <div v-if="profile.skills.length" class="flex flex-wrap gap-2">
          <span v-for="s in profile.skills" :key="s.skill"
            :class="['text-xs font-medium px-3 py-1.5 rounded-full border', levelColor[s.level]]">
            {{ s.skill }} · {{ s.level }}
          </span>
        </div>
        <div v-else class="text-slate-600 text-sm">No skills added yet.</div>
      </section>

      <section>
        <div class="section-label">Academic Declaration</div>
        <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex items-center gap-3">
          <div :class="['w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
            profile.academic_declaration_confirmed ? 'bg-blue-600 border-blue-600' : 'border-slate-600']">
            <span v-if="profile.academic_declaration_confirmed" class="text-white text-xs font-bold">✓</span>
          </div>
          <span class="text-sm text-slate-400">
            I declare no carried-over courses and my grade average meets the required threshold
          </span>
        </div>
      </section>
    </div>

    <!-- EDIT MODE -->
    <div v-else class="flex flex-col gap-8">
      <section>
        <div class="section-label">Basic Info</div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">University <span class="text-error">*</span></label>
            <input v-model="profile.university" type="text" placeholder="e.g. UKF Nitra"
              class="input" />
          </div>
          <div>
            <label class="label">Study Program <span class="text-error">*</span></label>
            <input v-model="profile.study_program" type="text" placeholder="e.g. Applied Informatics"
              class="input" />
          </div>
          <div>
            <label class="label">Year of Study <span class="text-error">*</span></label>
            <select v-model="profile.year_of_study"
              class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-9 px-3 text-white focus:outline-none focus:border-blue-500">
              <option :value="null" disabled class="bg-dark">Select year</option>
              <option v-for="y in [1,2,3,4,5,6]" :key="y" :value="y" class="bg-dark">{{ y }}. year</option>
            </select>
          </div>
          <div>
            <label class="label">GitHub URL</label>
            <input v-model="profile.github_url" type="url" placeholder="https://github.com/username"
              class="input" />
          </div>
        </div>
        <div class="mt-4">
          <label class="label">Bio</label>
          <textarea v-model="profile.bio" rows="3" placeholder="Tell us about yourself..."
            class="textarea"></textarea>
        </div>
      </section>

      <section>
        <div class="section-label">Skills</div>
        <div class="flex flex-col gap-2">
          <div v-for="(s, i) in profile.skills" :key="i" class="flex gap-2 items-center">
            <input v-model="s.skill" type="text" placeholder="e.g. Vue.js"
              class="bg-blue-600/10 border border-blue-900 rounded-md h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 flex-1" />
            <select v-model="s.level"
              class="bg-blue-600/10 border border-blue-900 rounded-md h-9 px-3 text-white focus:outline-none focus:border-blue-500 w-36">
              <option value="beginner" class="bg-dark">Beginner</option>
              <option value="intermediate" class="bg-dark">Intermediate</option>
              <option value="advanced" class="bg-dark">Advanced</option>
            </select>
            <button @click="removeSkill(i)" type="button"
              class="text-slate-600 hover:text-red-400 text-xl transition px-1 leading-none">×</button>
          </div>
          <button @click="addSkill" type="button"
            class="border border-dashed border-slate-700 hover:border-blue-700 text-slate-500 hover:text-blue-400 w-full h-9 rounded-md text-sm transition">
            + Add skill
          </button>
        </div>
      </section>

      <section>
        <div class="section-label">Academic Declaration</div>
        <div class="bg-blue-600/10 border border-blue-900 rounded-xl p-5">
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="profile.academic_declaration_confirmed" type="checkbox" class="mt-0.5 accent-blue-500" />
            <span class="text-sm text-gray-300">
              I declare that I have no carried-over courses and my average grade of core courses meets the required threshold. I understand this will be verified by the committee.
            </span>
          </label>
        </div>
      </section>
    </div>

    <button @click="router.push('/dashboard')"
      class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition mt-12 mb-10">
      Back to Dashboard
    </button>
  </div>
</template>