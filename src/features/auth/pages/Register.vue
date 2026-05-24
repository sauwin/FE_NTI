<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../../shared/api/axios'
import { useAuthStore } from '../stores/auth'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const role = ref('student')
const companyType = ref('owner')
const registrationNumber = ref('')
const agreedTerms = ref(false)
const agreedGdpr = ref(false)
const error = ref('')
const router = useRouter()
const auth = useAuthStore()

const isCompany = computed(() => role.value === 'company')

async function submit() {
  error.value = ''
  if (!agreedTerms.value) { error.value = 'You must agree to the Terms and Conditions'; return }
  if (!agreedGdpr.value) { error.value = 'You must agree to the processing of personal data (GDPR)'; return }

  try {
    const payload: Record<string, any> = {
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirm.value,
      role: role.value,
      gdpr_consent: true,
    }

    if (isCompany.value) {
      payload.company_type = companyType.value
      if (companyType.value === 'member' && registrationNumber.value.trim()) {
        payload.registration_number = parseInt(registrationNumber.value)
      }
    }

    const res = await api.post('/auth/register', payload)
    auth.login(res.data.token, res.data.user)
    router.push('/pending-verification')
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Registration failed'
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-6 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
      
      <div>
        <h1 class="font-bold text-3xl text-center text-white tracking-tight">Create an Account</h1>
        <p class="mt-2 text-center text-sm text-slate-400">
          Join the NTI platform and start your journey
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg flex items-center">
          <span>{{ error }}</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">First Name</label>
            <input 
              v-model="firstName" 
              type="text" 
              required
              placeholder="John"
              class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">Last Name</label>
            <input 
              v-model="lastName" 
              type="text" 
              required
              placeholder="Pork"
              class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">Email Address</label>
          <input 
            v-model="email" 
            type="email" 
            required
            placeholder="john.doe@example.com"
            class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required
            placeholder="••••••••"
            class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">Confirm Password</label>
          <input 
            v-model="passwordConfirm" 
            type="password" 
            required
            placeholder="••••••••"
            class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">Type of Account</label>
          <select 
            v-model="role" 
            class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm cursor-pointer"
          >
            <option value="student" class="bg-slate-900">Student</option>
            <option value="company" class="bg-slate-900">Company</option>
            <option value="mentor" class="bg-slate-900">Mentor</option>
          </select>
        </div>

        <div v-if="isCompany" class="p-4 bg-blue-600/5 border border-blue-900/40 rounded-xl space-y-4 transition-all duration-300 ease-in-out">
          <div>
            <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">Company Registration Type</label>
            <select 
              v-model="companyType" 
              class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm cursor-pointer"
            >
              <option value="owner" class="bg-slate-900">Company Owner</option>
              <option value="member" class="bg-slate-900">Company Member</option>
            </select>
          </div>
          
          <div v-if="companyType === 'member'">
            <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">Organization Registration Number</label>
            <input 
              v-model="registrationNumber" 
              type="text" 
              placeholder="Enter company organization ID"
              class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
            />
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
              I have read and agree to the 
              <router-link to="/terms" class="text-blue-400 hover:text-blue-300 hover:underline font-medium transition">Terms and Conditions</router-link>.
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
              I agree to the processing of personal data in accordance with the 
              <router-link to="/privacy" class="text-blue-400 hover:text-blue-300 hover:underline font-medium transition">Privacy Policy</router-link> (GDPR). 
              My data will be used solely for NTI program management purposes.
            </label>
          </div>
        </div>

        <button 
          type="submit"
          class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 active:bg-blue-700 transition duration-150 ease-in-out mt-6"
        >
          Register
        </button>

        <div class="text-center text-xs text-slate-400 mt-4">
          Already have an account? 
          <router-link class="text-blue-400 hover:text-blue-300 font-medium transition" to="/auth/login">Log in</router-link>
        </div>
      </form>
    </div>
  </div>
</template>