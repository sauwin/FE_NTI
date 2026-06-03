<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <footer class="w-full px-10 py-4 mt-auto border-t border-slate-800 bg-[#080f1e]/80 backdrop-blur">
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
      
      <div class="flex items-center gap-2">
        <img src="/logo.png" class="h-5 w-5 opacity-50 grayscale" alt="Logo">
        <p class="text-slate-400 text-[11px] uppercase tracking-wider">
          © {{ new Date().getFullYear() }} 
          <span class="text-slate-200 font-semibold ml-1">{{ t('footer.name') }}</span>
        </p>
      </div>

      <div class="flex gap-5 text-[11px] uppercase tracking-widest font-medium">
        <router-link to="/privacy" class="text-slate-500 hover:text-blue-400 transition">{{ t('footer.privacy') }}</router-link>
        <router-link to="/terms" class="text-slate-500 hover:text-blue-400 transition">{{ t('footer.terms') }}</router-link>
        <a href="mailto:contact@nti.sk" class="text-slate-500 hover:text-blue-400 transition">{{ t('footer.contact') }}</a>
      </div>
      
    </div>
  </footer>
</template>