<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/features/auth/stores/auth'
import { getStudentProfile, updateProfile } from '@/features/student/api/profile'
import type { Skill, StudentProfile } from '@/features/student/types/profile'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
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
  if (!profile.value.university.trim()) { error.value = t('student.profileView.errUniversity'); return }
  if (!profile.value.study_program.trim()) { error.value = t('student.profileView.errProgram'); return }
  if (!profile.value.year_of_study) { error.value = t('student.profileView.errYear'); return }

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
    fieldErrors.value = e.response?.data?.errors ?? {}
    error.value = e?.response?.data?.message || t('student.profileView.errSave')
  } finally {
    saving.value = false
  }
}

const levelColor: Record<string, string> = {
  beginner: 'text-slate-400 bg-slate-800/60 border-slate-700',
  intermediate: 'text-blue-400 bg-blue-900/30 border-blue-800',
  advanced: 'text-green-400 bg-green-900/30 border-green-800',
}

const resolveLevelText = (level: string) => {
  if (level === 'beginner') return t('student.profileView.levels.beginner')
  if (level === 'intermediate') return t('student.profileView.levels.intermediate')
  if (level === 'advanced') return t('student.profileView.levels.advanced')
  return level
}
</script>

<template>
  <div class="bg-blue-950 absolute rounded-full h-96 w-96 -z-10 -right-20 -top-10 blur-sm"></div>

  <div v-if="loading" class="text-slate-500 text-sm">{{ t('student.common.loading') }}</div>

  <!-- Header -->
  <div v-else>
    <div class="mb-10 flex items-start justify-between gap-6">
      <div>
        <div class="inline-flex items-center bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-4">
          {{ t('student.profileView.badge') }}
        </div>
        <h1 class="font-bold text-5xl leading-tight">
          {{ t('student.profileView.title') }} <span class="text-blue-400">{{ t('student.profileView.titleHighlight') }}</span>
        </h1>
      </div>
      <div class="flex gap-3 pt-10">
        <button v-if="!editMode" @click="editMode = true"
          class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
          {{ t('student.profileView.btnEdit') }}
        </button>
        <template v-else>
          <button v-if="!isNew" @click="editMode = false; error = ''"
            class="border border-slate-700 hover:border-slate-500 text-gray-400 hover:text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
            {{ t('student.common.cancel') }}
          </button>
          <button @click="save" :disabled="saving"
            class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
            {{ saving ? t('student.common.saving') : (isNew ? t('student.profileView.btnCreate') : t('student.profileView.btnSave')) }}
          </button>
        </template>
      </div>
    </div>

    <!-- New profile notice -->
    <div v-if="isNew"
      class="border border-yellow-800/50 bg-yellow-900/10 rounded-xl px-6 py-4 mb-8">
      <div class="text-sm font-semibold text-yellow-400 mb-1">{{ t('student.profileView.noticeTitle') }}</div>
      <div class="text-muted-sm">{{ t('student.profileView.noticeDesc') }}</div>
    </div>

    <div v-if="success"
      class="border border-green-800/50 bg-green-900/10 rounded-xl px-6 py-3 mb-8">
      <span class="text-green-400 text-sm font-medium">{{ t('student.common.successSave') }}</span>
    </div>
    <p v-if="error" class="text-red-400 text-sm mb-6">{{ error }}</p>

    <!-- VIEW MODE -->
    <div v-if="!editMode" class="flex flex-col gap-10">
      <section>
        <div class="section-label">{{ t('student.profileView.basicInfo') }}</div>
        <div class="grid grid-cols-2 gap-4">
          <div class="card">
            <div class="label-hint">{{ t('student.profileComplete.labelUniversity') }}</div>
            <div class="text-white font-medium">{{ profile.university || '—' }}</div>
          </div>
          <div class="card">
            <div class="label-hint">{{ t('student.profileComplete.labelProgram') }}</div>
            <div class="text-white font-medium">{{ profile.study_program || '—' }}</div>
          </div>
          <div class="card">
            <div class="label-hint">{{ t('student.profileComplete.labelYear') }}</div>
            <div class="text-white font-medium">
              {{ profile.year_of_study ? t('student.profileView.yearValue', { y: profile.year_of_study }) : '—' }}
            </div>
          </div>
          <div class="card">
            <div class="label-hint">{{ t('student.profileView.github') }}</div>
            <a v-if="profile.github_url" :href="profile.github_url" target="_blank"
              class="text-blue-400 hover:text-blue-300 text-sm transition break-all">
              {{ profile.github_url }}
            </a>
            <div v-else class="text-slate-500">—</div>
          </div>
        </div>
        <div v-if="profile.bio" class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mt-4">
          <div class="text-xs text-slate-500 uppercase tracking-wide mb-2">{{ t('student.profileView.bio') }}</div>
          <div class="text-slate-300 text-sm leading-relaxed">{{ profile.bio }}</div>
        </div>
      </section>

      <section>
        <div class="section-label">{{ t('student.profileView.skills') }}</div>
        <div v-if="profile.skills.length" class="flex flex-wrap gap-2">
          <span v-for="s in profile.skills" :key="s.skill"
            :class="['text-xs font-medium px-3 py-1.5 rounded-full border', levelColor[s.level]]">
            {{ s.skill }} · {{ resolveLevelText(s.level) }}
          </span>
        </div>
        <div v-else class="text-slate-600 text-sm">{{ t('student.profileView.noSkills') }}</div>
      </section>

      <section>
        <div class="section-label">{{ t('student.profileView.academicDeclaration') }}</div>
        <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex items-center gap-3">
          <div :class="['w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
            profile.academic_declaration_confirmed ? 'bg-blue-600 border-blue-600' : 'border-slate-600']">
            <span v-if="profile.academic_declaration_confirmed" class="text-white text-xs font-bold">✓</span>
          </div>
          <span class="text-sm text-slate-400">
            {{ t('student.profileView.declarationText') }}
          </span>
        </div>
      </section>
    </div>

    <!-- EDIT MODE -->
    <div v-else class="flex flex-col gap-8">
      <section>
        <div class="section-label">{{ t('student.profileView.basicInfo') }}</div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">{{ t('student.profileComplete.labelUniversity') }} <span class="text-error">*</span></label>
            <input v-model="profile.university" type="text" :placeholder="t('student.profileComplete.placeholderUniversity')"
              class="input" />
            <p v-if="fieldErrors.university?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.university[0] }}</p>
          </div>
          <div>
            <label class="label">{{ t('student.profileComplete.labelProgram') }} <span class="text-error">*</span></label>
            <input v-model="profile.study_program" type="text" :placeholder="t('student.profileComplete.placeholderProgram')"
              class="input" />
            <p v-if="fieldErrors.study_program?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.study_program[0] }}</p>
          </div>
          <div>
            <label class="label">{{ t('student.profileComplete.labelYear') }} <span class="text-error">*</span></label>
            <select v-model="profile.year_of_study"
              class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-9 px-3 text-white focus:outline-none focus:border-blue-500">
              <option :value="null" disabled class="bg-dark">{{ t('student.profileView.selectYear') }}</option>
              <option v-for="y in [1,2,3,4,5,6]" :key="y" :value="y" class="bg-dark">
                {{ t('student.profileView.yearValue', { y }) }}
              </option>
            </select>
            <p v-if="fieldErrors.year_of_study?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.year_of_study[0] }}</p>
          </div>
          <div>
            <label class="label">{{ t('student.profileComplete.labelGithub') }}</label>
            <input v-model="profile.github_url" type="url" placeholder="https://github.com/username"
              class="input" />
            <p v-if="fieldErrors.github_url?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.github_url[0] }}</p>
          </div>
        </div>
        <div class="mt-4">
          <label class="label">{{ t('student.profileComplete.labelBio') }}</label>
          <textarea v-model="profile.bio" rows="3" :placeholder="t('student.profileComplete.placeholderBio')"
            class="textarea"></textarea>
          <p v-if="fieldErrors.bio?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.bio[0] }}</p>
        </div>
      </section>

      <section>
        <div class="section-label">{{ t('student.profileView.skills') }}</div>
        <div class="flex flex-col gap-2">
          <div v-for="(s, i) in profile.skills" :key="i" class="flex gap-2 items-center">
            <input v-model="s.skill" type="text" :placeholder="t('student.profileView.placeholderSkill')"
              class="bg-blue-600/10 border border-blue-900 rounded-md h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 flex-1" />
            <select v-model="s.level"
              class="bg-blue-600/10 border border-blue-900 rounded-md h-9 px-3 text-white focus:outline-none focus:border-blue-500 w-36">
              <option value="beginner" class="bg-dark">{{ t('student.profileView.levels.beginner') }}</option>
              <option value="intermediate" class="bg-dark">{{ t('student.profileView.levels.intermediate') }}</option>
              <option value="advanced" class="bg-dark">{{ t('student.profileView.levels.advanced') }}</option>
            </select>
            <button @click="removeSkill(i)" type="button"
              class="text-slate-600 hover:text-red-400 text-xl transition px-1 leading-none">×</button>
          </div>
          <button @click="addSkill" type="button"
            class="border border-dashed border-slate-700 hover:border-blue-700 text-slate-500 hover:text-blue-400 w-full h-9 rounded-md text-sm transition">
            {{ t('student.profileView.addSkill') }}
          </button>
        </div>
      </section>

      <section>
        <div class="section-label">{{ t('student.profileView.academicDeclaration') }}</div>
        <div class="bg-blue-600/10 border border-blue-900 rounded-xl p-5">
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="profile.academic_declaration_confirmed" type="checkbox" class="mt-0.5 accent-blue-500" />
            <span class="text-sm text-gray-300">
              {{ t('student.profileView.declarationEdit') }}
            </span>
          </label>
        </div>
      </section>
    </div>

    <button @click="router.push('/dashboard')"
      class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition mt-12 mb-10">
      {{ t('student.profileView.backToDashboard') }}
    </button>
  </div>
</template>