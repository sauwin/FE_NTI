<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="flex flex-col justify-center items-center min-h-screen py-10 px-4 bg-slate-950 text-gray-300">
    <div class="w-full max-w-md bg-slate-900/40 p-8 border border-slate-900 rounded-2xl text-center backdrop-blur-md shadow-2xl">
      
      <div class="mb-6 inline-flex justify-center items-center w-16 h-16 rounded-full bg-blue-950/50 border border-blue-900/30 text-blue-500 text-2xl font-bold animate-pulse">
        404
      </div>

      <h1 class="text-3xl font-bold text-white mb-2 tracking-tight">
        Page Not Found
      </h1>
      
      <p class="text-sm text-slate-400 mb-8 leading-relaxed">
        Please check your URL and try again later
      </p>

      <div class="flex flex-col gap-3">
        <button 
          @click="goBack" 
          class="w-full border border-slate-800 text-slate-400 h-11 rounded-lg hover:text-white hover:bg-slate-900/50 transition text-sm font-medium"
        >
          Go Back
        </button>
        
        <button 
          @click="goHome" 
          class="w-full bg-blue-600 text-white h-11 rounded-lg font-medium hover:bg-blue-700 transition text-sm shadow-lg shadow-blue-950"
        >
          Home Page
        </button>
      </div>

    </div>
  </div>
</template>