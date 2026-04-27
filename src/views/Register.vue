<script lang="ts" setup>
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
    <form class="flex flex-col gap-2 mt-5" @submit.prevent="submit">
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <div class="flex gap-4">
        <div>
          <label class="block text-blue-800">Name</label>
          <input v-model="firstName" type="text" class="border border-black w-48 h-8" />
        </div>

        <div>
          <label class="block text-blue-800">Surname</label>
          <input v-model="lastName" type="text" class="border border-black w-48 h-8" />
        </div>
      </div>

      <div>
        <label class="block text-blue-800">Email</label>
        <input v-model="email" type="email" class="border border-black w-100 h-8" />
      </div>

      <div>
        <label class="block text-blue-800">Password</label>
        <input v-model="password" type="password" class="border border-black w-100 h-8" />
      </div>

      <div>
        <label class="block text-blue-800">Confirm password</label>
        <input v-model="passwordConfirm" type="password" class="border border-black w-100 h-8" />
      </div>

      <div>
        <label class="block text-blue-800">Type of account</label>
        <select v-model="role" class="border border-black w-100 h-8">
          <option value="student">Student</option>
          <option value="company">Company</option>
          <option value="mentor">Mentor</option>
          <option value="internal">Internal role</option>
        </select>
      </div>

      <div class="mt-2">
        I read and agree to Terms and conditions <input v-model="agreed" type="checkbox" class="align-middle" />
      </div>

      <input type="submit" class="bg-blue-700 text-white w-100 h-10 mt-4">
      
      <div class = "text-center mt-4">
        Already have an account? <router-link class="text-blue-600 hover:text-blue-900" to="/login">Log in</router-link>
      </div>
    </form>
  </div>
</template>