<template>
  <h1 class="font-bold text-4xl text-center p-4">Login</h1>
  <div class="flex justify-center">
    <form class="flex flex-col gap-2 mt-5" @submit.prevent="submit">
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <div>
        <label for="email" class="block text-blue-800">Email</label>
        <input v-model="email" type="email" class="border border-black w-100 h-8" />
      </div>
      <div>
        <label for="password" class="block text-blue-800">Password</label>
        <input v-model="password" type="password" class="border border-black w-100 h-8" />
      </div>
<!--      <div>
        <label for="confirm" class="block text-blue-800">Type of account</label>
        <select name="type" id="type" class="border border-black w-100 h-8">
          <option value="student">Student</option>
          <option value="company">Company</option>
          <option value="mentor">Mentor</option>
          <option value="internal">Internal role</option>
        </select>
      </div>-->
      <input type="submit" class="bg-blue-700 text-white w-100 h-10 mt-4">
      <div class = "text-center mt-4">
        Not registered? <router-link class="text-blue-600 hover:text-blue-900" to="/register">Create an account</router-link>
      </div>
    </form>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

async function submit() {
  error.value = ''
  try {
    const res = await api.post('/auth/login', { email: email.value, password: password.value })
    localStorage.setItem('token', res.data.token)
    router.push('/dashboard')
  } catch {
    error.value = 'Invalid email or password'
  }
}
</script>