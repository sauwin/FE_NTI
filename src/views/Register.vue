<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const role = ref('student')
const agreed = ref(false)
const error = ref('')
const router = useRouter()

async function submit() {
  error.value = ''
  if (!agreed.value) { error.value = 'You must agree to Terms'; return }
  try {
    const res = await api.post('/auth/register', {
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirm.value,
      role: role.value,
    })
    localStorage.setItem('token', res.data.token)
    router.push('/dashboard')
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
          <option value="internal" class="bg-slate-800">Internal role</option>
        </select>
      </div>

      <div class="mt-2">
        I read and agree to Terms and conditions <input v-model="agreed" type="checkbox" class="align-middle" />
      </div>

      <input type="submit" class="bg-blue-700 text-white w-100 h-10 mt-4">
      
      <div class = "text-center mt-4">
        Already have an account? <router-link class="text-blue-600 hover:text-blue-900" to="/auth/login">Log in</router-link>
      </div>
    </form>
  </div>
</template>