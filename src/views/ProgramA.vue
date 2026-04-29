<template>
  <div class="px-20 py-10">
    <div class="bg-blue-950 absolute rounded-[100%] h-120 w-120 -z-10 -right-30 -top-10"></div>

    <div class="pb-20">
      <div class="bg-blue-600 text-blue-100 text-xs font-bold text-center py-1 rounded-xl w-32 mb-5">PROGRAM A</div>
      <h1 class="font-bold text-5xl text-left leading-tight">
        Grant Incubation<br> 
        <span class="text-blue-400">Program</span>
      </h1>
      <p class="text-gray-300 max-w-2xl mt-7 mb-8 leading-relaxed">
        Turn your innovative idea into a reality. Program A is designed for teams aiming to build a startup or a unique product. We provide the funding, expert mentoring, and technical resources needed to accelerate your project to the market.
      </p>

      <div class="flex gap-4">
        <button class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition">Submit Application</button>
        <button class="border border-gray-500 hover:border-gray-400 text-gray-300 px-8 py-3 rounded-lg font-medium transition">Learn more</button>
      </div>
    </div>

    <div class="mb-24">
      <h2 class="text-3xl font-medium mb-10">What <span class="text-blue-400">projects</span> are we looking for?</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div v-for="stack in ['Software Development', 'AI & Data Tech', 'Web Applications', 'Game Development', 'IoT & Embedded']" 
             :key="stack" 
             class="bg-blue-900/30 border border-blue-800 p-4 rounded-xl text-center hover:border-blue-400 transition cursor-default">
          <span class="text-sm font-medium">{{ stack }}</span>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-4 italic">System validates these technology stacks during the application process.</p>
    </div>

    <div class="justify-left mb-24">
      <h2 class="text-3xl font-medium mb-10">How does it <span class="text-blue-400">work</span>?</h2>
      <div class="flex flex-wrap lg:flex-nowrap gap-6">
        <div class="flex-1 min-w-[250px] border-2 border-blue-400 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-400">1.</div> 
          <h3 class="text-xl font-bold mt-8">Register Team</h3>
          <div class="text-sm text-gray-300 mt-4">Create your profile and form a team of at least 3 members to get started.</div>
        </div>
        <div class="flex-1 min-w-[250px] border-2 border-blue-300 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-300">2.</div>
          <h3 class="text-xl font-bold mt-8">Submit Proposal</h3>
          <div class="text-sm text-gray-300 mt-4">Upload your Roadmap, Executive Summary, and Technical Architecture.</div>
        </div>
        <div class="flex-1 min-w-[250px] border-2 border-blue-400 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-400">3.</div> 
          <h3 class="text-xl font-bold mt-8">Evaluation</h3>
          <div class="text-sm text-gray-300 mt-4">Your application will undergo formal verification and assessment by the commission.</div>
        </div>
        <div class="flex-1 min-w-[250px] border-2 border-blue-300 rounded-2xl p-8 bg-slate-900/50">
          <div class="text-6xl font-bold text-blue-300">4.</div> 
          <h3 class="text-xl font-bold mt-8">Incubation</h3>
          <div class="text-sm text-gray-300 mt-4">Upon approval, receive funding, get assigned a mentor, and start building your product.</div>
        </div>
      </div>
    </div>

    <div class="px-20 py-10 text-white relative overflow-hidden bg-slate-950"></div>
    <div class="bg-blue-950 absolute rounded-[100%] h-120 w-120 -z-10 -right-30 -top-10 blur-3xl opacity-50"></div>
      
    <div>
      <div class="flex items-end justify-between mb-12">
        <div>
          <h2 class="text-4xl font-bold mb-4">Eligibility <span class="text-blue-400">Criteria</span></h2>
          <p class="text-gray-400 max-w-xl">Make sure your team meets the program’s basic requirements before submitting your application.</p>
        </div>
        <div class="hidden lg:block h-px flex-1 bg-gradient-to-r from-transparent via-blue-900 to-transparent mx-10 mb-5"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="group p-8 rounded-3xl bg-blue-900/10 border border-blue-900/50 hover:border-blue-400 transition-all duration-300">
          <div class="text-blue-400 text-sm font-bold tracking-widest mb-6 uppercase">Minimum Requirement</div>
          <div class="text-5xl font-bold mb-4">3+</div>
          <h3 class="text-xl font-bold mb-3">Team Members</h3>
          <p class="text-gray-400 text-sm leading-relaxed">
            All participants must complete their profiles by listing their skills and uploading their CVs.
          </p>
        </div>

        <div class="group p-8 rounded-3xl bg-blue-900/10 border border-blue-900/50 hover:border-blue-400 transition-all duration-300">
          <div class="text-blue-400 text-sm font-bold tracking-widest mb-6 uppercase">Academic Integrity</div>
          <div class="flex items-center gap-2 mb-4">
              <span class="text-2xl font-bold italic text-blue-300">No Fails</span>
          </div>
          <h3 class="text-xl font-bold mb-3">Carried-over Courses</h3>
          <p class="text-gray-400 text-sm leading-relaxed">
            No deferred items. For the MVP phase, this is confirmed by a declaration and the upload of a statement.
          </p>
        </div>

        <div class="group p-8 rounded-3xl bg-blue-900/10 border border-blue-900/50 hover:border-blue-400 transition-all duration-300">
          <div class="text-blue-400 text-sm font-bold tracking-widest mb-6 uppercase">Performance</div>
          <div class="text-5xl font-bold mb-4">AVG</div>
          <h3 class="text-xl font-bold mb-3">Grade Threshold</h3>
          <p class="text-gray-400 text-sm leading-relaxed">
            The average score in specialized subjects must be below the established threshold (the system uses this as a signal for evaluation).
          </p>
        </div>
      </div>
    </div>

    <h2 class="text-4xl font-bold mb-12 mt-24 text-center">Mandatory <span class="text-blue-400">Documentation</span></h2>
        
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">1</div>
        <div>
          <h4 class="font-bold text-lg">Executive Summary</h4>
          <p class="text-xs text-gray-500 mt-1 uppercase tracking-tighter">Problem description and solution</p>
        </div>
      </div>

      <div class="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">2</div>
        <div>
          <h4 class="font-bold text-lg">Technical Architecture</h4>
          <p class="text-xs text-gray-500 mt-1 uppercase tracking-tighter">Description of Technologies and Modules</p>
        </div>
      </div>

      <div class="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">3</div>
        <div>
          <h4 class="font-bold text-lg">Roadmap</h4>
          <p class="text-xs text-gray-500 mt-1 uppercase tracking-tighter">Milestones and Implementation Plan</p>
        </div>
      </div>

      <div class="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">4</div>
        <div>
          <h4 class="font-bold text-lg">Budget Plan</h4>
          <p class="text-xs text-gray-500 mt-1 uppercase tracking-tighter">Grant Expenditure Plan</p>
        </div>
      </div>

      <div class="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">5</div>
        <div>
          <h4 class="font-bold text-lg">Risk Analysis</h4>
          <p class="text-xs text-gray-500 mt-1 uppercase tracking-tighter">Identifying and Mitigating Risks</p>
        </div>
      </div>

      <div class="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
        <div class="flex-shrink-0 w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">6</div>
        <div>
          <h4 class="font-bold text-lg">Monetization Model</h4>
          <p class="text-xs text-gray-500 mt-1 uppercase tracking-tighter">How value and revenue are generated</p>
        </div>
      </div>
    </div>
  </div>
</template>