<script setup lang="ts">
const mission = [
  {
    title: 'Incubate Ideas',
    desc: 'We help students develop innovative ideas into real products with structured support and funding.',
  },
  {
    title: 'Connect with Companies',
    desc: 'We bridge the gap between student talent and companies that need software development.',
  },
  {
    title: 'Mentor & Guide',
    desc: 'Every project gets an assigned mentor who guides the team through milestones and challenges.',
  },
  {
    title: 'Launch Products',
    desc: 'Our goal is working software — not just presentations. Teams ship real, usable products.',
  },
]
</script>

<template>
  <div class="container-main">
    <div class="bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>

    <div class="section-divider-md">
      <div class="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-6">
        About
      </div>
      <h1 class="font-bold text-6xl leading-tight mb-7">
        About <span class="text-blue-400">NTI</span>
      </h1>
      <p class="text-gray-400 max-w-xl leading-relaxed text-base">
        Nitrianský technologický inkubátor is a student-focused innovation platform at UKF Nitra.
        We help students turn ideas into products and connect them with real companies.
      </p>
    </div>

    <!-- MISSION -->
    <section class="section-divider">
      <div class="section-label-light">Mission</div>
      <h2 class="text-3xl font-semibold mb-10">What we do</h2>
      <div class="flex flex-wrap lg:flex-nowrap gap-0 border border-slate-800 rounded-2xl overflow-hidden">
        <div v-for="item in mission" :key="item.title"
          class="flex-1 min-w-52 p-8 border-r border-slate-800 last:border-r-0 hover:bg-blue-950/20 transition">
          <h3 class="text-base font-semibold text-white mb-3">{{ item.title }}</h3>
          <p class="text-sm text-gray-500 leading-relaxed">{{ item.desc }}</p>
        </div>
      </div>
    </section>

    <!-- TEAM -->
    <section class="section-divider">
      <div class="section-label-light">Who we are</div>
      <h2 class="text-3xl font-semibold mb-10">Built for students, by UKF</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="border border-slate-800 bg-slate-900/50 rounded-2xl p-8">
          <h3 class="text-lg font-semibold text-white mb-3">For Students</h3>
          <p class="text-sm text-gray-400 leading-relaxed">
            NTI is open to all students of UKF Nitra who want to work on real tech projects.
            Whether you have a startup idea or want to gain commercial experience — there's a program for you.
          </p>
        </div>
        <div class="border border-slate-800 bg-slate-900/50 rounded-2xl p-8">
          <h3 class="text-lg font-semibold text-white mb-3">For Companies</h3>
          <p class="text-sm text-gray-400 leading-relaxed">
            Companies can submit projects to our backlog. NTI matches them with motivated student teams,
            coordinates the process, and ensures quality output with mentor supervision.
          </p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <div class="card-cta">
      <div>
        <h3 class="text-xl font-semibold text-white mb-1">Want to join?</h3>
        <p class="text-sm text-slate-500">Check out our programs and apply for the next open call</p>
      </div>
      <div class="flex gap-3">
        <router-link to="/programs/a"
          class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition text-sm whitespace-nowrap">
          Program A
        </router-link>
        <router-link to="/programs/b"
          class="border border-slate-700 hover:border-slate-500 text-gray-400 hover:text-gray-200 px-6 py-3 rounded-lg font-medium transition text-sm whitespace-nowrap">
          Program B
        </router-link>
      </div>
    </div>

  </div>
</template>