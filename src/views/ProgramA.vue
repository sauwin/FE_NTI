<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToUpload = () => {
  router.push('/programs/a/upload')
}
</script>

<template>
  <div class="px-20 py-10">
    <div class="bg-blue-950 absolute rounded-[100%] h-120 w-120 -z-10 -right-30 -top-10"></div>

    <div class="pb-20 mb-12">
      <div class="bg-blue-600 text-blue-100 text-xs font-bold text-center py-1 rounded-xl w-32 mb-5">PROGRAM A</div>
      <h1 class="font-bold text-5xl text-left leading-tight">
        Grant Incubation<br> 
        <span class="text-blue-400">Program</span>
      </h1>
      <p class="text-gray-300 max-w-2xl mt-7 mb-8 leading-relaxed">
        Turn your innovative idea into a reality. Program A is designed for teams aiming to build a startup or a unique product. We provide the funding, expert mentoring, and technical resources needed to accelerate your project to the market.
      </p>

      <div class="flex gap-4">
        <button @click="goToUpload" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition">Submit Application</button>
        <button class="border border-gray-500 hover:border-gray-400 text-gray-300 px-8 py-3 rounded-lg font-medium transition">Learn more</button>
      </div>
    </div>

    <section class="justify-left mb-24">
      <h2 class="text-3xl font-medium mb-10">How does it work?</h2>
      <div class="flex flex-wrap lg:flex-nowrap gap-6">
        <div class="flex-1 min-w-62 border-2 border-blue-600 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-500">1.</div> 
          <h3 class="text-xl font-bold mt-8">Register Team</h3>
          <div class="text-sm text-gray-300 mt-4">Create your profile and form a team of at least 3 members to get started.</div>
        </div>
        <div class="flex-1 min-w-62 border-2 border-blue-800 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-600">2.</div>
          <h3 class="text-xl font-bold mt-8">Submit Proposal</h3>
          <div class="text-sm text-gray-300 mt-4">Upload your Roadmap, Executive Summary, and Technical Architecture.</div>
        </div>
        <div class="flex-1 min-w-62 border-2 border-blue-600 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-500">3.</div> 
          <h3 class="text-xl font-bold mt-8">Evaluation</h3>
          <div class="text-sm text-gray-300 mt-4">Your application will undergo formal verification and assessment by the commission.</div>
        </div>
        <div class="flex-1 min-w-62 border-2 border-blue-800 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-600">4.</div> 
          <h3 class="text-xl font-bold mt-8">Incubation</h3>
          <div class="text-sm text-gray-300 mt-4">Upon approval, receive funding, get assigned a mentor, and start building your product.</div>
        </div>
      </div>
    </section>

    <section class="mb-24">
      <h2 class="text-3xl font-medium mb-10">What projects are we looking for?</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div v-for="stack in ['Software Development', 'AI & Data Tech', 'Web Applications', 'Game Development', 'IoT & Embedded']" 
             :key="stack" 
             class="bg-blue-900/10 border-2 border-blue-600 p-4 rounded-xl text-center hover:border-blue-500 transition cursor-default">
          <span class="text-sm font-medium">{{ stack }}</span>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-3xl font-medium mb-10">Mandatory Documentation</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          class="flex gap-5 p-6 rounded-2xl border-2 bg-blue-900/10 border-blue-800 hover:border-blue-600 transition"
          v-for="document, index in [
            {
              name: 'Executive Summary',
              description: 'Problem description and solution'
            },
            {
              name: 'Technical Architecture',
              description: 'Description of Technologies and Modules'
            },
            {
              name: 'Roadmap',
              description: 'Milestones and Implementation Plan'
            },
            {
              name: 'Budget Plan',
              description: 'Grant Expenditure Plan'
            },
            {
              name: 'Risk Analysis',
              description: 'Identifying and Mitigating Risks'
            },
            {
              name: 'Monetization Model',
              description: 'How value and revenue are generated'
            },
          ]" 
          :key="index"
        >
          <div class="shrink-0 w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">{{index+1}}</div>
          <div>
            <h4 class="font-bold text-lg text-blue-100">{{document["name"]}}</h4>
            <p class="text-xs text-gray-500 mt-1 uppercase tracking-tighter">{{document["description"]}}</p>
          </div>
        </div>
      </div>
    </section>    
  </div>
</template>