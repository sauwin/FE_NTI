<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/features/auth/api/auth'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)

async function submit() {
  error.value = ''
  try {
    loading.value = true
    const res = await login({ email: email.value, password: password.value })
    auth.login(res.data.token, res.data.user)
    router.push('/dashboard')
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status === 403) {
        const msg = e.response.data.message
        if (msg === 'pending_verification') {
          router.push('/pending-verification')
        } else if (msg === 'pending_approval') {
          router.push('/pending-approval')
        } else {
          error.value = 'Access denied'
        }
      } else {
        error.value = 'Invalid email or password'
      }
    } 
    console.error(e)
    error.value = 'Unexpected error'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-6 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
      
      <div>
        <h1 class="font-bold text-3xl text-center text-white tracking-tight">Welcome Back</h1>
        <p class="mt-2 text-center text-sm text-slate-400">
          Log in to your NTI account to continue
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg flex items-center">
          <span>{{ error }}</span>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">Email Address</label>
          <input 
            v-model="email" 
            type="email" 
            required
            placeholder="john.pork@example.com"
            class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
          />
        </div>

        <div>
          <div class="flex justify-between items-center">
            <label class="block text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
          </div>
          <input 
            v-model="password" 
            type="password" 
            required
            placeholder="••••••••"
            class="mt-1 block w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition text-sm" 
          />
          <router-link class="mt-1 text-xs text-blue-400 hover:text-blue-300 transition" to="/auth/forgot-password">
              Forgot password?
          </router-link>
        </div>

        <button 
          type="submit"
          :disabled="loading"
          class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 active:bg-blue-700 transition duration-150 ease-in-out mt-6 cursor-pointer"
        >
          {{ loading ? 'Loading...' : 'Sign In' }}
        </button>

        <div class="text-center text-xs text-slate-400 mt-4">
          Not registered? 
          <router-link class="text-blue-400 hover:text-blue-300 font-medium transition" to="/auth/register">
            Create an account
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>