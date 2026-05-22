<template>
  <div class="min-h-screen bg-[#080f1e] flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <div class="inline-flex items-center bg-yellow-600/15 border border-yellow-800 text-yellow-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-6">
        Pending Verification
      </div>
      <h1 class="font-bold text-4xl text-white mb-4">
        Check your <span class="text-yellow-400">email</span>
      </h1>
      <p class="text-slate-400 text-sm leading-relaxed mb-8">
        We sent a verification link to your email address. Click the link to activate your account.
      </p>
      <div class="border border-slate-800 bg-slate-900/50 rounded-xl p-6 text-left mb-8">
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <div class="w-5 h-5 rounded-full border border-yellow-600 flex items-center justify-center shrink-0">
              <span class="text-yellow-400 text-xs">⋯</span>
            </div>
            <span class="text-sm text-slate-400">Waiting for email verification</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-5 h-5 rounded-full border border-slate-700 shrink-0"></div>
            <span class="text-sm text-slate-600">Account activated</span>
          </div>
        </div>
      </div>
      <router-link to="/auth/login"
        class="text-sm text-blue-400 hover:text-blue-300 transition">
        ← Back to Login
      </router-link>
    </div>
  </div>
</template>