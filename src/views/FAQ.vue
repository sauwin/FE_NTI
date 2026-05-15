<script setup lang="ts">
import { ref } from 'vue'

const open = ref<number | null>(null)

function toggle(i: number) {
  open.value = open.value === i ? null : i
}

const faqs = [
  {
    q: 'Who can apply to Program A?',
    a: 'Any student of UKF Nitra can apply. You need a team of at least 3 members, all with completed student profiles. Academic eligibility is confirmed by a sworn declaration.',
  },
  {
    q: 'What documents are required for Program A?',
    a: 'You need to upload 6 documents: Executive Summary, Technical Architecture, Roadmap, Budget Plan, Risk Analysis, and a Monetization Model.',
  },
  {
    q: 'How often can I apply?',
    a: 'NTI opens evaluation rounds quarterly. You can apply in any open round. The committee will notify you of the decision by email.',
  },
  {
    q: 'What is Program B?',
    a: 'Program B connects student teams with real companies that have software development tasks. You apply to a specific company project, get selected by the committee together with the company, and work on the project with an NTI mentor.',
  },
  {
    q: 'Is there financial compensation in Program B?',
    a: 'Yes. Each company sets a budget for the student team. The compensation is defined in the project brief before you apply.',
  },
  {
    q: 'Can one student be in multiple teams?',
    a: 'No. A student can only be an active member of one team at a time per program.',
  },
  {
    q: 'What happens after my application is approved?',
    a: 'You will be onboarded — an NTI mentor is assigned, project milestones are set, and the active phase begins. You will track progress and upload deliverables through the platform.',
  },
  {
    q: 'How is the application evaluated?',
    a: 'Each application is reviewed by multiple committee members independently. They score it based on weighted criteria defined per call. The final score is a weighted average.',
  },
]
</script>

<template>
  <div class="container-main">
    <div class="bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>

    <div class="section-divider-md">
      <div class="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-6">
        FAQ
      </div>
      <h1 class="font-bold text-6xl leading-tight mb-7">
        Frequently asked <span class="text-blue-400">questions</span>
      </h1>
      <p class="text-gray-400 max-w-xl text-base leading-relaxed">
        Everything you need to know about NTI programs, applications, and the process.
      </p>
    </div>

    <section class="max-w-3xl">
      <div v-for="(faq, i) in faqs" :key="i"
        class="border-b border-slate-800 last:border-b-0">
        <button
          @click="toggle(i)"
          class="w-full flex items-center justify-between py-5 text-left gap-4">
          <span class="text-base font-medium text-white">{{ faq.q }}</span>
          <span class="text-blue-400 text-lg flex-shrink-0 transition-transform duration-200"
            :class="open === i ? 'rotate-45' : ''">+</span>
        </button>
        <div v-if="open === i" class="pb-5 text-sm text-gray-400 leading-relaxed">
          {{ faq.a }}
        </div>
      </div>
    </section>

  </div>
</template>