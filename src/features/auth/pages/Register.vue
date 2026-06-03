<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { register } from '@/features/auth/api/auth'
import { useAuthStore } from '../stores/auth'
import type { RegisterPayload } from '@/features/auth/types/auth'

const { t } = useI18n()
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const role = ref('student')
const companyRole = ref('owner')
const registrationNumber = ref('')
const agreedTerms = ref(false)
const agreedGdpr = ref(false)
const fieldErrors = ref<Record<string, string[]>>({})
const error = ref('')
const router = useRouter()
const auth = useAuthStore()

const isCompany = computed(() => role.value === 'company')

const loading = ref(false)

async function submit() {
  error.value = ''
  if (!agreedTerms.value) { error.value = t('register.errors.termsRequired'); return }
  if (!agreedGdpr.value) { error.value = t('register.errors.gdprRequired'); return }

  try {
    const payload: RegisterPayload = {
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirm.value,
      role: role.value,
      agreed_terms: agreedTerms.value,
      gdpr_consent: agreedGdpr.value,
    }

    if (password.value !== passwordConfirm.value) {
      error.value = t('register.errors.passwordsMismatch')
      return
    }

    if (isCompany.value) {
      payload.role_in_org = companyRole.value
      if (companyRole.value === 'member') {
        if (registrationNumber.value.trim()) {
          const id = Number(registrationNumber.value.trim())

          if (Number.isNaN(id)) {
            error.value = t('register.errors.invalidOrgId')
            return
          } 

          payload.registration_number = id
        } else {
          error.value = t('register.errors.missingOrgId')
          return
        }
      }
    }

    loading.value = true
    const res = await register(payload)
    auth.login(res.data.token, res.data.user)
    router.push('/pending-verification')
  } catch (e: any) {
    fieldErrors.value = e.response?.data?.errors ?? {}
    error.value = e.response?.data?.message ?? t('register.errors.failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-6 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
      
      <div>
        <h1 class="font-bold text-3xl text-center text-white tracking-tight">{{ t('register.title') }}</h1>
        <p class="mt-2 text-center text-sm text-slate-400">
          {{ t('register.subtitle') }}
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg flex items-center">
          <span>{{ error }}</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">{{ t('register.firstName') }}</label>
            <input 
              v-model="firstName" 
              type="text" 
              required
              placeholder="John"
              class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
            />
            <p v-if="fieldErrors.first_name?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.first_name[0] }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">{{ t('register.lastName') }}</label>
            <input 
              v-model="lastName" 
              type="text" 
              required
              placeholder="Pork"
              class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
            />
            <p v-if="fieldErrors.last_name?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.last_name[0] }}</p>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">{{ t('register.email') }}</label>
          <input 
            v-model="email" 
            type="email" 
            required
            placeholder="john.pork@example.com"
            class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
          />
          <p v-if="fieldErrors.email?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.email[0] }}</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">{{ t('register.password') }}</label>
          <input 
            v-model="password" 
            type="password" 
            required
            placeholder="••••••••"
            class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
          />
          <p v-if="fieldErrors.password?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.password[0] }}</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">{{ t('register.confirmPassword') }}</label>
          <input 
            v-model="passwordConfirm" 
            type="password" 
            required
            placeholder="••••••••"
            class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
          />
          <p v-if="fieldErrors.password_confirmation?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.password_confirmation[0] }}</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">{{ t('register.accountType') }}</label>
          <select 
            v-model="role" 
            class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm cursor-pointer"
          >
            <option value="student" class="bg-slate-900">{{ t('register.student') }}</option>
            <option value="company" class="bg-slate-900">{{ t('register.company') }}</option>
          </select>
        </div>

        <div v-if="isCompany" class="p-4 bg-blue-600/5 border border-blue-900/40 rounded-xl space-y-4 transition-all duration-300 ease-in-out">
          <div>
            <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">{{ t('register.companyType') }}</label>
            <select 
              v-model="companyRole" 
              class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm cursor-pointer"
            >
              <option value="owner" class="bg-slate-900">{{ t('register.owner') }}</option>
              <option value="member" class="bg-slate-900">{{ t('register.member') }}</option>
            </select>
          </div>
          
          <div v-if="companyRole === 'member'">
            <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">{{ t('register.regNumber') }}</label>
            <input 
              v-model="registrationNumber" 
              type="text" 
              placeholder="Enter company organization ID"
              class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
            />
            <p v-if="fieldErrors.registration_number?.[0]" class="text-red-400 text-xs mt-1">{{ fieldErrors.registration_number[0] }}</p>
          </div>
        </div>

        <hr class="border-slate-800/60 my-2" />

        <div class="space-y-3 px-1">
          <!-- Terms & Conditions -->
          <div class="flex items-start gap-3">
            <div class="flex items-center h-5">
              <input 
                v-model="agreedTerms" 
                type="checkbox" 
                id="terms" 
                class="h-4 w-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500/40 accent-blue-500 cursor-pointer" 
              />
            </div>
            <label for="terms" class="text-xs text-slate-400 cursor-pointer select-none leading-normal">
              {{ t('register.termsText') }} 
              <router-link to="/terms" class="text-blue-400 hover:text-blue-300 hover:underline font-medium transition">{{ t('register.termsLink') }}</router-link>.
            </label>
          </div>

          <div class="flex items-start gap-3">
            <div class="flex items-center h-5">
              <input 
                v-model="agreedGdpr" 
                type="checkbox" 
                id="gdpr" 
                class="h-4 w-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500/40 accent-blue-500 cursor-pointer" 
              />
            </div>
            <label for="gdpr" class="text-xs text-slate-400 cursor-pointer select-none leading-normal">
              {{ t('register.gdprText') }} 
              <router-link to="/privacy" class="text-blue-400 hover:text-blue-300 hover:underline font-medium transition">{{ t('register.gdprLink') }}</router-link> {{ t('register.gdprSuffix') }}
            </label>
          </div>
        </div>

        <button 
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 active:bg-blue-700 transition duration-150 ease-in-out mt-6"
        >
          {{ loading ? t('register.btnLoading') : t('register.btnRegister') }}
        </button>

        <div class="text-center text-xs text-slate-400 mt-4">
          {{ t('register.alreadyAccount') }} 
          <router-link class="text-blue-400 hover:text-blue-300 font-medium transition" to="/auth/login">{{ t('register.logIn') }}</router-link>
        </div>
      </form>
    </div>
  </div>
</template>