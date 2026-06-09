<script setup lang="ts">
  import PageHero from '@/shared/ui/PageHero.vue'
  import PageSection from '@/shared/ui/PageSection.vue'
  import Articles from '@/features/articles/components/Articles.vue'
  import CallToAction from '@/shared/components/CallToAction.vue'
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { getActiveCalls } from '@/shared/api/calls'
  import type { ActiveCall } from '@/shared/types/calls'

  const { t, locale } = useI18n()
  const activeCalls = ref<ActiveCall[]>([])
  const loadingCalls = ref(true)
  const now = ref(Date.now())
  let timerInterval: ReturnType<typeof setInterval> | null = null

  onMounted(async () => {
    try {
      const res = await getActiveCalls()
      activeCalls.value = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : [])
    } catch (e) {
      console.error(e)
    } finally {
      loadingCalls.value = false
    }

    timerInterval = setInterval(() => {
      now.value = Date.now()
    }, 60000)
  })

  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
  })

  function programLabel(code?: string) {
    if (code === 'program_a') return t('home.programs.prog_a_label')
    if (code === 'program_b') return t('home.programs.prog_b_label')
    return t('home.programs.fallback_label')
  }

  function statusClass(status: string) {
    switch (status) {
      case 'open':   return 'bg-green-500/15 text-green-400 border-green-800'
      case 'closed': return 'bg-red-500/15 text-red-400 border-red-800'
      case 'draft':  return 'bg-yellow-500/15 text-yellow-400 border-yellow-800'
      default:       return 'bg-slate-500/15 text-slate-400 border-slate-700'
    }
  }

  function formatDeadline(date?: string | null) {
    if (!date) return t('home.calls.no_deadline')
    return new Date(date).toLocaleDateString(locale.value === 'sk' ? 'sk-SK' : 'en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  function calculateUrgency(deadlineStr: string | null | undefined, currentNow: number) {
    if (!deadlineStr) return null
    const distance = new Date(deadlineStr).getTime() - currentNow
    if (distance < 0) return { text: t('home.calls.urgency.ended'), isUrgent: false }
    const days  = Math.floor(distance / (1000 * 60 * 60 * 24))
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 7) return { text: t('home.calls.urgency.days_left', { days }), isUrgent: false }
    if (days > 0) return { text: t('home.calls.urgency.time_left', { days, hours }), isUrgent: true }
    return { text: t('home.calls.urgency.closes_hours', { hours }), isUrgent: true }
  }

  const sortedCalls = computed(() => {
    const data = Array.isArray(activeCalls.value) ? activeCalls.value : []
    return data
      .filter(call => call.status === 'open')
      .map(call => ({ ...call, urgency: calculateUrgency(call.deadline_at, now.value) }))
      .sort((a, b) => new Date(a.deadline_at || '').getTime() - new Date(b.deadline_at || '').getTime())
  })
</script>

<template>
  <div class="hidden md:block bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>

  <PageHero
    :badge="t('home.hero.badge')"
    :title="t('home.hero.title')"
    :highlight="t('home.hero.highlight')"
    :description="t('home.hero.description')"
  >
    <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 w-full sm:w-auto">
      <router-link to="/programs/a" class="btn-primary text-center">
        {{ t('home.hero.btn_explore') }}
      </router-link>
      <router-link to="/about" class="btn-secondary text-center">
        {{ t('home.hero.btn_about') }}
      </router-link>
    </div>
  </PageHero>

  <PageSection :label="t('home.programs.label')" :title="t('home.programs.title')">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <div class="card-glowing p-6 sm:p-8">
        <div class="inline-block bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1 px-3 rounded-full mb-5">
          {{ t('home.programs.prog_a_label') }}
        </div>
        <h3 class="text-2xl font-bold mb-3">{{ t('home.programs.prog_a_title') }}</h3>
        <p class="text-gray-400 text-sm leading-relaxed mb-6">{{ t('home.programs.prog_a_desc') }}</p>
        <ul class="flex flex-col gap-2 mb-8">
          <li class="bullet-point"><span class="bullet-dot"></span>{{ t('home.programs.prog_a_bullets.team') }}</li>
          <li class="bullet-point"><span class="bullet-dot"></span>{{ t('home.programs.prog_a_bullets.rounds') }}</li>
          <li class="bullet-point"><span class="bullet-dot"></span>{{ t('home.programs.prog_a_bullets.docs') }}</li>
        </ul>
        <router-link to="/programs/a" class="btn-link">{{ t('home.programs.learn_more') }}</router-link>
      </div>

      <div class="card-glowing p-6 sm:p-8">
        <div class="inline-block bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1 px-3 rounded-full mb-5">
          {{ t('home.programs.prog_b_label') }}
        </div>
        <h3 class="text-2xl font-bold mb-3">{{ t('home.programs.prog_b_title') }}</h3>
        <p class="text-gray-400 text-sm leading-relaxed mb-6">{{ t('home.programs.prog_b_desc') }}</p>
        <ul class="flex flex-col gap-2 mb-8">
          <li class="bullet-point"><span class="bullet-dot"></span>{{ t('home.programs.prog_b_bullets.projects') }}</li>
          <li class="bullet-point"><span class="bullet-dot"></span>{{ t('home.programs.prog_b_bullets.comp') }}</li>
          <li class="bullet-point"><span class="bullet-dot"></span>{{ t('home.programs.prog_b_bullets.mentor') }}</li>
        </ul>
        <router-link to="/programs/b" class="btn-link">{{ t('home.programs.learn_more') }}</router-link>
      </div>

    </div>
  </PageSection>

  <PageSection
    v-if="!loadingCalls && sortedCalls.length > 0"
    :label="t('home.calls.label')"
    :title="t('home.calls.title')"
  >
    <div
      v-if="loadingCalls"
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <div
        v-for="i in 2"
        :key="i"
        class="card-glowing p-6 animate-pulse"
      >
        <div class="h-5 w-24 bg-slate-800 rounded mb-5"></div>
        <div class="h-7 w-2/3 bg-slate-800 rounded mb-4"></div>
        <div class="h-4 w-full bg-slate-800 rounded mb-2"></div>
        <div class="h-4 w-4/5 bg-slate-800 rounded mb-6"></div>
        <div class="h-10 w-full bg-slate-800 rounded-xl"></div>
      </div>
    </div>

    <div
      v-else-if="sortedCalls.length === 0"
      class="card-glowing p-12 text-center max-w-2xl mx-auto flex flex-col items-center justify-center border border-dashed border-slate-800"
    >
      <div class="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500 text-xl">
        🔔
      </div>
      <h4 class="text-lg font-semibold text-white mb-2">
        {{ t('home.calls.empty_title', 'No Active Calls') }}
      </h4>
      <p class="text-sm text-slate-400 max-w-sm leading-relaxed mb-1">
        {{ t('home.calls.empty') }}
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <div
        v-for="call in sortedCalls"
        :key="call.id"
        class="card-glowing p-6 flex flex-col"
      >
        <div class="flex items-center justify-between gap-4 mb-5">
          <div class="flex items-center gap-2">
            <div
              class="inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold tracking-wide uppercase"
              :class="statusClass(call.status)"
            >
              {{ call.status ? t(`home.calls.status.${call.status}`) : call.status }}
            </div>
            <span
              v-if="call.urgency"
              :class="[
                'text-[11px] font-medium px-2 py-0.5 rounded',
                call.urgency.isUrgent
                  ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 animate-pulse'
                  : 'text-slate-400 bg-slate-800'
              ]"
            >
              {{ call.urgency.text }}
            </span>
          </div>
          <div class="text-xs text-slate-500 font-mono">{{ programLabel(call.program) }}</div>
        </div>

        <h3 class="text-xl font-bold text-white mb-3 leading-snug">{{ call.name }}</h3>

        <p class="text-sm text-slate-400 leading-relaxed mb-6">
          {{ t('home.calls.deadline') }}
          <span class="text-white font-medium">{{ formatDeadline(call.deadline_at) }}</span>
        </p>

        <div class="flex items-center justify-between text-xs text-slate-500 mb-6">
          <span>
            {{ t('home.calls.min_team') }}
            <span class="text-slate-300">{{ call.min_team_size }}</span>
          </span>
          <span v-if="call.max_team_size">
            {{ t('home.calls.max_team') }}
            <span class="text-slate-300">{{ call.max_team_size }}</span>
          </span>
        </div>

        <router-link :to="`/calls/${call.id}`" class="btn-primary mt-auto text-center">
          {{ t('home.calls.btn_view') }}
        </router-link>
      </div>
    </div>
  </PageSection>

  <PageSection :label="t('home.news.label')" :title="t('home.news.title')">
    <Articles />
  </PageSection>

  <CallToAction />
</template>