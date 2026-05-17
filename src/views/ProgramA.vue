<script setup lang="ts">
import { useRouter } from 'vue-router'
import Documentation from '../components/Documentation.vue'

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
      <div class="section-label-light">Application process</div>
      <h2 class="text-3xl font-medium mb-10">How does it work?</h2>
      <div class="flex flex-wrap lg:flex-nowrap gap-6">
        <div class="flex-1 min-w-62 border-2 border-blue-800 rounded-2xl p-8 bg-slate-950">
          <div class="text-6xl font-bold text-blue-300">1.</div> 
          <h3 class="heading-xl">Register Team</h3>
          <div class="text-muted">Create your profile and form a team of at least 3 members to get started.</div>
        </div>
        <div class="flex-1 min-w-62 border-2 border-blue-800 rounded-2xl p-8 bg-slate-950">
          <div class="text-6xl font-bold text-blue-300">2.</div>
          <h3 class="heading-xl">Submit Proposal</h3>
          <div class="text-muted">Upload your Roadmap, Executive Summary, and Technical Architecture.</div>
        </div>
        <div class="flex-1 min-w-62 border-2 border-blue-800 rounded-2xl p-8 bg-slate-950">
          <div class="text-6xl font-bold text-blue-300">3.</div> 
          <h3 class="heading-xl">Evaluation</h3>
          <div class="text-muted">Your application will undergo formal verification and assessment by the commission.</div>
        </div>
        <div class="flex-1 min-w-62 border-2 border-blue-800 rounded-2xl p-8 bg-slate-950">
          <div class="text-6xl font-bold text-blue-300">4.</div> 
          <h3 class="heading-xl">Incubation</h3>
          <div class="text-muted">Upon approval, receive funding, get assigned a mentor, and start building your product.</div>
        </div>
      </div>
    </section>

    <section class="section-divider">
      <div class="section-label-light">Mission</div>
      <h2 class="text-3xl font-semibold mb-10">What we do</h2>
      <div class="flex flex-wrap lg:flex-nowrap gap-0 border border-slate-800 rounded-2xl overflow-hidden">
        <div class="flex-1 min-w-52 p-8 border-r border-slate-800 last:border-r-0 bg-yellow-800/5 hover:bg-yellow-400/10 transition">
          <h3 class="text-base font-semibold text-white mb-3">Software Development</h3>
        </div>
        <div class="flex-1 min-w-52 p-8 border-r border-slate-800 last:border-r-0 bg-red-800/5 hover:bg-red-400/10 transition">
          <h3 class="text-base font-semibold text-white mb-3">AI & Data Tech</h3>
        </div>
        <div class="flex-1 min-w-52 p-8 border-r border-slate-800 last:border-r-0 bg-green-800/5 hover:bg-green-400/10 transition">
          <h3 class="text-base font-semibold text-white mb-3">Web Applications</h3>
        </div>
        <div class="flex-1 min-w-52 p-8 border-r border-slate-800 last:border-r-0 bg-blue-800/5 hover:bg-blue-400/10 transition">
          <h3 class="text-base font-semibold text-white mb-3">Game Development</h3>
        </div>
        <div class="flex-1 min-w-52 p-8 border-r border-slate-800 last:border-r-0 bg-yellow-800/5 hover:bg-purple-400/10 transition">
          <h3 class="text-base font-semibold text-white mb-3">IoT & Embedded</h3>
        </div>
      </div>
    </section>
    
    <section>
      <div class="section-label-light">Attachment</div>
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <h2 class="text-3xl font-semibold text-white">Mandatory documentation</h2>
      </div>

      <div class="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div class="rounded-4xl border border-slate-800 bg-slate-950 p-6">
          <p class="text-sm uppercase tracking-[0.24em] text-slate-500">01</p>
          <h3 class="mt-4 text-xl font-semibold text-white">Executive Summary</h3>
          <p class="mt-3 text-slate-400">Problem statement, value proposition and go-to-market plan.</p>
        </div>
        <div class="rounded-4xl border border-slate-800 bg-slate-950 p-6">
          <p class="text-sm uppercase tracking-[0.24em] text-slate-500">02</p>
          <h3 class="mt-4 text-xl font-semibold text-white">Technical Architecture</h3>
          <p class="mt-3 text-slate-400">Technology stack, module design, and development approach.</p>
        </div>
        <div class="rounded-4xl border border-slate-800 bg-slate-950 p-6">
          <p class="text-sm uppercase tracking-[0.24em] text-slate-500">03</p>
          <h3 class="mt-4 text-xl font-semibold text-white">Roadmap</h3>
          <p class="mt-3 text-slate-400">Milestones, timelines, and implementation phases.</p>
        </div>
        <div class="rounded-4xl border border-slate-800 bg-slate-950 p-6">
          <p class="text-sm uppercase tracking-[0.24em] text-slate-500">04</p>
          <h3 class="mt-4 text-xl font-semibold text-white">Budget Plan</h3>
          <p class="mt-3 text-slate-400">Planned spending and resource allocation.</p>
        </div>
        <div class="rounded-4xl border border-slate-800 bg-slate-950 p-6">
          <p class="text-sm uppercase tracking-[0.24em] text-slate-500">05</p>
          <h3 class="mt-4 text-xl font-semibold text-white">Risk Analysis</h3>
          <p class="mt-3 text-slate-400">Risks, dependencies and mitigation strategy.</p>
        </div>
        <div class="rounded-4xl border border-slate-800 bg-slate-950 p-6">
          <p class="text-sm uppercase tracking-[0.24em] text-slate-500">06</p>
          <h3 class="mt-4 text-xl font-semibold text-white">Monetization Model</h3>
          <p class="mt-3 text-slate-400">Revenue strategy and business model.</p>
        </div>
      </div>
    </section>
  </div>
</template>