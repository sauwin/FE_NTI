<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'
import { useAuthStore } from '../stores/auth'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const role = ref('student')
const companyType = ref('owner')
const registrationNumber = ref('')
const agreed = ref(false)
const error = ref('')
const router = useRouter()
const auth = useAuthStore()
const isCompany = computed(() => role.value === 'company')

async function submit() {
  error.value = ''
  if (!agreed.value) { error.value = 'You must agree to Terms'; return }
  try {
    const payload: Record<string, any> = {
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirm.value,
      role: role.value,
    }

    if (isCompany.value) {
      payload.company_type = companyType.value
      if (companyType.value === 'member' && registrationNumber.value.trim()) {
        payload.registration_number = parseInt(registrationNumber.value)
      }
    }

    const res = await api.post('/auth/register', payload)
    auth.login(res.data.token, res.data.user)
    router.push('/pending-verification')  // was /dashboard
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Registration failed'
  }
}
</script>

<template>
  <h1 class="font-bold text-4xl text-center p-4">Register</h1>
  <div class="flex justify-center">
    <form class="flex flex-col gap-1.5 mt-5" @submit.prevent="submit">
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <div class="flex gap-4">
        <div>
          <label class="block text-white">Name</label>
          <input v-model="firstName" type="text" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-48 h-9" />
        </div>

        <div>
          <label class="block text-white">Surname</label>
          <input v-model="lastName" type="text" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-48 h-9" />
        </div>
      </div>

      <div>
        <label class="block text-white">Email</label>
        <input v-model="email" type="email" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
      </div>

      <div>
        <label class="block text-white">Password</label>
        <input v-model="password" type="password" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
      </div>

      <div>
        <label class="block text-white">Confirm password</label>
        <input v-model="passwordConfirm" type="password" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
      </div>

      <div>
        <label class="block text-white">Type of account</label>
        <select v-model="role" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9">
          <option value="student" class="bg-slate-800">Student</option>
          <option value="company" class="bg-slate-800">Company</option>
          <option value="mentor" class="bg-slate-800">Mentor</option>
        </select>
      </div>

      <div v-if="isCompany" class="space-y-4">
        <div>
          <label class="block text-white">Company registration type</label>
          <select v-model="companyType" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9">
            <option value="owner" class="bg-slate-800">Company Owner</option>
            <option value="member" class="bg-slate-800">Company Member</option>
          </select>
        </div>

        <div v-if="companyType === 'member'">
          <label class="block text-white">Organization registration number</label>
          <input v-model="registrationNumber" type="text" placeholder="Enter your company organization ID"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
        </div>
      </div>

      <div class="mt-2">
        I read and agree to Terms and conditions <input v-model="agreed" type="checkbox" class="align-middle" />
      </div>

      <input type="submit" class="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white w-100 h-10 mt-4">
      
      <div class = "text-center mt-4">
        Already have an account? <router-link class="text-blue-500 hover:text-blue-600" to="/auth/login">Log in</router-link>
      </div>
    </form>
  </div>
</template>