<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { completeStudentProfile } from '@/features/student/api/profile'
import { useAuthStore } from '../../auth/stores/auth'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const error = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
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
    error.value = t('student.profileComplete.errDeclaration')
    return
  }
  loading.value = true
  try {
    await completeStudentProfile({
      study_program: studyProgram.value,
      year_of_study: yearOfStudy.value,
      university: university.value,
      bio: bio.value,
      github_url: githubUrl.value,
      academic_declaration_confirmed: academicDeclaration.value,
    })
    router.push('/dashboard')
  } catch (e: any) {
    fieldErrors.value = e.response?.data?.errors ?? {}
    error.value = e.response?.data?.message ?? t('student.profileComplete.errSave')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex-center-page">
    <div class="w-full max-w-xl">
      <div class="mb-8 text-center">
        <h1 class="font-bold text-4xl text-white">{{ t('student.profileComplete.title') }}</h1>
        <p class="text-gray-400 mt-2 text-sm">{{ t('student.profileComplete.subtitle') }}</p>
      </div>

      <form class="flex-col-gap" @submit.prevent="submit">
        <p v-if="error" class="text-error-sm">{{ error }}</p>

        <div>
          <label class="label">{{ t('student.profileComplete.labelProgram') }} <span class="text-error">*</span></label>
          <input v-model="studyProgram" type="text" :placeholder="t('student.profileComplete.placeholderProgram')"
                 class="input" />
          <p v-if="fieldErrors.study_program?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.study_program[0] }}</p>
        </div>

        <div>
          <label class="label">{{ t('student.profileComplete.labelYear') }} <span class="text-error">*</span></label>
          <select v-model="yearOfStudy"
                  class="bg-blue-600/10 border border-blue-900 rounded-md w-full h-9 px-3 text-white focus:outline-none focus:border-blue-500">
            <option v-for="y in 6" :key="y" :value="y" class="bg-dark">
              {{ t('student.profileComplete.yearOption', { y }) }}
            </option>
          </select>
          <p v-if="fieldErrors.year_of_study?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.year_of_study[0] }}</p>
        </div>

        <div>
          <label class="label">{{ t('student.profileComplete.labelUniversity') }}</label>
          <input v-model="university" type="text" :placeholder="t('student.profileComplete.placeholderUniversity')"
                 class="input" />
          <p v-if="fieldErrors.university?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.university[0] }}</p>
        </div>

        <div>
          <label class="label">{{ t('student.profileComplete.labelBio') }}</label>
          <textarea v-model="bio" rows="3" :placeholder="t('student.profileComplete.placeholderBio')"
                    class="textarea"></textarea>
          <p v-if="fieldErrors.bio?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.bio[0] }}</p>
        </div>

        <div>
          <label class="label">{{ t('student.profileComplete.labelGithub') }}</label>
          <input v-model="githubUrl" type="url" placeholder="https://github.com/username"
                 class="input" />
          <p v-if="fieldErrors.github_url?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.github_url[0] }}</p>
        </div>

        <div class="bg-blue-600/10 border border-blue-900 rounded-md p-4">
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="academicDeclaration" type="checkbox" class="mt-0.5 accent-blue-500" />
            <span class="text-sm text-gray-300">
              {{ t('student.profileComplete.declarationText') }}
            </span>
          </label>
        </div>

        <button type="submit" :disabled="loading"
                class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-full h-10 mt-2 rounded-md text-sm font-medium cursor-pointer">
          {{ loading ? t('student.common.saving') : t('student.profileComplete.btnSave') }}
        </button>
      </form>
    </div>
  </div>
</template>