<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHero from '@/shared/ui/PageHero.vue'
import { getPartners, getContactMembers } from '../api/partners'

const { t } = useI18n()

const partners = ref<any[]>([])
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    loading.value = true
    error.value = false
    
    const res = await getPartners()
    const allPartners = res.data?.data ?? res.data ?? []
    
    partners.value = await Promise.all(
      allPartners.map(async (partner: any) => {
        try {
          const contactsRes = await getContactMembers(partner.id)
          
          const contactsList = contactsRes?.data ?? contactsRes ?? []
          
          return {
            ...partner,
            contactMembers: contactsList
          }
        } catch (e) {
          console.error(`Не вдалося завантажити контакти для партнера ${partner.id}:`, e)
          return {
            ...partner,
            contactMembers: [] // у разі помилки конкретного запиту, картка не ламає всю сторінку
          }
        }
      })
    )
  } catch (e) {
    console.error('Помилка завантаження сторінки партнерів:', e)
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

  <section class="max-w-6xl mx-auto px-6 py-10 mt-[-50px] relative">
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="h-[260px] rounded-2xl bg-slate-900/40 border border-slate-800/60 p-6 animate-pulse"></div>
    </div>

    <div v-else-if="error" class="text-center py-20 text-red-400">
      {{ t('partners.states.error') }}
    </div>

    <div v-else-if="partners.length === 0" class="text-center py-20 text-slate-500">
      {{ t('partners.states.empty') }}
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="partner in partners"
        :key="partner.id"
        class="group flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 backdrop-blur-sm"
      >
        <div>
          <div class="h-14 flex items-center mb-3">
            <img v-if="partner.logo_url" :src="partner.logo_url" :alt="partner.name" class="max-h-12 max-w-full object-contain" />
            <span v-else class="text-white font-bold text-lg">{{ partner.name }}</span>
          </div>

          <div class="mb-4">
            <p v-if="partner.sector" class="text-xs font-mono text-blue-400 mb-1 uppercase tracking-wide">{{ partner.sector }}</p>
            <h3 class="text-white font-semibold text-base">{{ partner.name }}</h3>
          </div>

          <div class="mt-4 pt-4 border-t border-slate-800/60">
            <p class="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              {{ t('partners.labels.contacts') }}
            </p>
            
            <div v-if="partner.contactMembers && partner.contactMembers.length > 0" class="space-y-2">
              <div 
                v-for="contact in partner.contactMembers" 
                :key="contact.id || contact.email" 
                class="bg-slate-950/40 border border-slate-800/50 p-2 rounded-xl text-xs"
              >
                <div class="font-medium text-slate-200">
                  {{ contact.first_name }} {{ contact.last_name }}
                </div>
                <a :href="`mailto:${contact.email}`" class="text-slate-500 hover:text-blue-400 font-mono text-[11px] block truncate mt-0.5">
                  {{ contact.email }}
                </a>
              </div>
            </div>
            
            <p v-else class="text-xs text-slate-600 italic">
              {{ t('partners.states.noContacts') }}
            </p>
          </div>
        </div>

        <div class="pt-4 mt-4 border-t border-slate-800/40">
          <a v-if="partner.website" :href="partner.website" target="_blank" rel="noopener noreferrer" class="text-sm text-slate-400 hover:text-white transition truncate block">
            {{ partner.website.replace(/^https?:\/\/(www\.)?/, '') }}
          </a>
          <span v-else class="text-xs text-slate-600 italic">
            {{ t('partners.states.noWebsite') }}
          </span>
        </div>

      </div>
    </div>
  </section>
</template>