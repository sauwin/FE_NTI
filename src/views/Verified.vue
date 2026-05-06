<template>
  <div class="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
    <div class="bg-blue-950 absolute rounded-[100%] h-96 w-96 -z-10 opacity-50 blur-3xl"></div>

    <div class="flex flex-col items-center max-w-lg">
      <div class="bg-blue-600 text-blue-100 text-[10px] font-bold py-1 px-4 rounded-xl mb-6 uppercase">
        Success
      </div>

      <h1 class="font-bold text-5xl leading-tight mb-4">
        Email <span class="text-blue-400">Verified!</span>
      </h1>

      <p class="text-gray-300 mb-10 leading-relaxed">
        Your account is now active. You can now proceed to the dashboard and start working on your projects.
      </p>

      <router-link 
        to="/Dashboard" 
        class="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-lg font-medium transition">
        Go to Dashboard
      </router-link>
    </div>
  </div>
</template>
