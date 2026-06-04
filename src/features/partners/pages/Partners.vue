<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHero from '@/shared/ui/PageHero.vue'
import { getPartners } from '../api/partners'

const { t } = useI18n()

const partners = ref<any[]>([])
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    const res = await getPartners()
    partners.value = res.data?.data ?? res.data ?? []
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="hidden md:block bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>

  <PageHero
      :badge="t('partners.hero.badge')"
      :title="t('partners.hero.title')"
      :highlight="t('partners.hero.highlight')"
      :description="t('partners.hero.description')"
  />

  <section class="max-w-6xl mx-auto px-6 py-16">
    <div v-if="loading" class="text-center text-slate-400 py-20">{{ t('partners.states.loading') }}</div>

    <div v-else-if="error" class="text-center text-red-400 py-20">{{ t('partners.states.error') }}</div>

    <div v-else-if="partners.length === 0" class="text-center text-slate-500 py-20">{{ t('partners.states.empty') }}</div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
          v-for="partner in partners"
          :key="partner.id"
          class="flex flex-col gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
      >
        <div class="h-14 flex items-center">
          <img
              v-if="partner.logo_url"
              :src="partner.logo_url"
              :alt="partner.name"
              class="max-h-12 max-w-full object-contain"
          />
          <span v-else class="text-white font-bold text-lg">{{ partner.name }}</span>
        </div>

        <div class="flex-1">
          <p v-if="partner.sector" class="text-xs font-mono text-blue-400 mb-1 uppercase tracking-wide">{{ partner.sector }}</p>
          <h3 class="text-white font-semibold text-base">{{ partner.name }}</h3>
        </div>

        <a v-if="partner.website"
        :href="partner.website"
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm text-slate-400 hover:text-white transition truncate"
        >
        {{ partner.website }}
        </a>
      </div>
    </div>
  </section>
</template>