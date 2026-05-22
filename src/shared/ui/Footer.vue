<template>
  <footer class="w-full px-10 py-4 mt-auto border-t border-slate-800 bg-[#080f1e]/80 backdrop-blur">
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
      
      <div class="flex items-center gap-2">
        <img src="/logo.png" class="h-5 w-5 opacity-50 grayscale" alt="Logo">
        <p class="text-slate-400 text-[11px] uppercase tracking-wider">
          © {{ new Date().getFullYear() }} 
          <span class="text-slate-200 font-semibold ml-1">Nitriansky technologický inkubátor</span>
        </p>
      </div>

      <div class="flex gap-5 text-[11px] uppercase tracking-widest font-medium">
        <router-link to="/privacy" class="text-slate-500 hover:text-blue-400 transition">Privacy Policy</router-link>
        <router-link to="/terms" class="text-slate-500 hover:text-blue-400 transition">Terms of Service</router-link>
        <a href="mailto:contact@nti.sk" class="text-slate-500 hover:text-blue-400 transition">Contact</a>
      </div>
      
    </div>
  </footer>
</template>