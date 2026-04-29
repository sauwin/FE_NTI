<template>
  <div class="px-20 py-10">
    <div class="bg-blue-950 absolute rounded-[100%] h-120 w-120 -z-10 -right-30 -top-10 "></div>

    <div class="pb-20">
      <div class="bg-blue-600 text-blue-100 text-xs font-bold text-center py-1 rounded-xl w-32 mb-5">PROGRAM B</div>
      <h1 class="font-bold text-5xl leading-tight">Real-world<br /><span class="text-blue-400">Industry Practice</span></h1>
      <p class="text-gray-300 max-w-2xl mt-7 mb-8 leading-relaxed">
        Program B connects student teams with real companies and live industry challenges. 
        You work on production-like tasks, deliver real value, and gain hands-on experience in a team-driven environment.
      </p>
      <div class="flex gap-4">
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition">
          Join Program
        </button>
        <button class="border border-gray-500 hover:border-gray-400 text-gray-300 px-8 py-3 rounded-lg font-medium transition">
          View Challenges
        </button>
      </div>
    </div>

    <div class="mb-24">
      <h2 class="text-3xl font-medium mb-10">
        What <span class="text-blue-400">companies</span> are looking for?
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div
          v-for="item in [
            'Web Platforms',
            'Business Systems',
            'AI Solutions',
            'Mobile Apps',
            'IoT Integrations'
          ]"
          :key="item"
          class="bg-blue-900/30 border border-blue-800 p-4 rounded-xl text-center hover:border-blue-400 transition"
        >
          <span class="text-sm font-medium">{{ item }}</span>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-4 italic">
        Projects are based on real company requirements and validated by NTI.
      </p>
    </div>
    <div class="mb-24">
      <h2 class="text-3xl font-medium mb-10">
        How does it <span class="text-blue-400">work</span>?
      </h2>
      <div class="flex flex-wrap lg:flex-nowrap gap-6">
        <div class="flex-1 min-w-[250px] border border-blue-400 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-400">1.</div>
          <h3 class="text-xl font-bold mt-8">Company Submission</h3>
          <p class="text-sm text-gray-300 mt-4">
            A company defines a real technical problem, budget, and expectations.
          </p>
        </div>
        <div class="flex-1 min-w-[250px] border border-blue-300 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-300">2.</div>
          <h3 class="text-xl font-bold mt-8">Team Matching</h3>
          <p class="text-sm text-gray-300 mt-4">
            NTI assigns or selects student teams based on skills and motivation.
          </p>
        </div>
        <div class="flex-1 min-w-[250px] border border-blue-400 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-400">3.</div>
          <h3 class="text-xl font-bold mt-8">Execution</h3>
          <p class="text-sm text-gray-300 mt-4">
            Teams work with mentors and Product Owners on real deliverables.
          </p>
        </div>
        <div class="flex-1 min-w-[250px] border border-blue-300 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-300">4.</div>
          <h3 class="text-xl font-bold mt-8">Delivery</h3>
          <p class="text-sm text-gray-300 mt-4">
            Final solution is reviewed, accepted by company, and archived.
          </p>
        </div>
      </div>
    </div>

    <div class="bg-blue-950 absolute rounded-[100%] h-120 w-120 -z-10 -right-30 -top-10 blur-3xl opacity-50"></div>

    <div class="mb-24">
      <h2 class="text-4xl font-bold mb-10">
        Participation <span class="text-blue-400">Requirements</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="p-8 rounded-3xl bg-blue-900/10 border border-blue-900/50">
          <div class="text-blue-400 text-sm font-bold uppercase mb-6">Team Size</div>
          <div class="text-5xl font-bold mb-4">3+</div>
          <h3 class="text-xl font-bold mb-3">Members Required</h3>
          <p class="text-gray-400 text-sm">
            Teams must consist of at least three members with complementary skills.
          </p>
        </div>
        <div class="p-8 rounded-3xl bg-blue-900/10 border border-blue-900/50">
          <div class="text-blue-400 text-sm font-bold uppercase mb-6">Commitment</div>
          <div class="text-3xl font-bold mb-4">Active</div>
          <h3 class="text-xl font-bold mb-3">Participation</h3>
          <p class="text-gray-400 text-sm">
            Teams must actively participate in mentoring sessions and project milestones.
          </p>
        </div>
        <div class="p-8 rounded-3xl bg-blue-900/10 border border-blue-900/50">
          <div class="text-blue-400 text-sm font-bold uppercase mb-6">Delivery Focus</div>
          <div class="text-3xl font-bold mb-4">Real</div>
          <h3 class="text-xl font-bold mb-3">Industry Output</h3>
          <p class="text-gray-400 text-sm">
            Work must result in a usable product, prototype, or production feature.
          </p>
        </div>
      </div>
    </div>

    <h2 class="text-4xl font-bold mb-12 text-center">Required <span class="text-blue-400">Deliverables</span></h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <h4 class="font-bold text-lg">Technical Proposal</h4>
        <p class="text-xs text-gray-500 mt-1">Solution architecture & approach</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <h4 class="font-bold text-lg">Implementation Plan</h4>
        <p class="text-xs text-gray-500 mt-1">Milestones and delivery roadmap</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <h4 class="font-bold text-lg">Progress Reports</h4>
        <p class="text-xs text-gray-500 mt-1">Weekly updates and mentoring logs</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <h4 class="font-bold text-lg">Final Product</h4>
        <p class="text-xs text-gray-500 mt-1">Deployed or demo-ready solution</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <h4 class="font-bold text-lg">Documentation</h4>
        <p class="text-xs text-gray-500 mt-1">Technical & user documentation</p>
      </div>

      <div class="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <h4 class="font-bold text-lg">Final Presentation</h4>
        <p class="text-xs text-gray-500 mt-1">Demo for company and NTI board</p>
      </div>
    </div>

  </div>
</template>