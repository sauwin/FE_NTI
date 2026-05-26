<script setup lang="ts">
  import PageHero from '@/shared/ui/PageHero.vue'
  import PageSection from '@/shared/ui/PageSection.vue'
  import Articles from '@/features/articles/components/Articles.vue'
  import CallToAction from '@/shared/components/CallToAction.vue'
  import { ref, computed, onMounted } from 'vue'
  import { getActiveCalls } from '@/shared/api/calls'
  import type { ActiveCall } from '@/shared/types/calls'

  const activeCalls = ref<ActiveCall[]>([])
  const loadingCalls = ref(true)

  onMounted(async () => {
    try {
      const res = await getActiveCalls()
      activeCalls.value = res.data
    } catch (e) {
      console.error(e)
    } finally {
      loadingCalls.value = false
    }
  })

  function programLabel(code?: string) {
    if (code === 'program_a') return 'Program A'
    if (code === 'program_b') return 'Program B'
    return 'Program'
  }

  function statusClass(status: string) {
    switch (status) {
      case 'open':
        return 'bg-green-500/15 text-green-400 border-green-800'

      case 'closed':
        return 'bg-red-500/15 text-red-400 border-red-800'

      case 'draft':
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-800'

      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-700'
    }
  }

  function formatDeadline(date?: string | null) {
    if (!date) return 'No deadline'

    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const sortedCalls = computed(() => {
    return [...activeCalls.value].sort((a, b) => {
      return (
        new Date(a.deadline_at || '').getTime() -
        new Date(b.deadline_at || '').getTime()
      )
    })
  })
</script>

<template>
  <div class="container-main relative overflow-hidden">
    
    <div class="hidden md:block bg-blue-950 absolute rounded-full h-120 w-120 -z-10 -right-30 -top-10"></div>

    <PageHero
      badge="Nitrianský technologický inkubátor"
      title="Zanechaj svoju stopu v"
      highlight="technologickej budúcnosti"
      description="A prispej k rozvoju nitrianského regiónu"
    >
      <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 w-full sm:w-auto">
        <router-link to="/programs/a" class="btn-primary text-center">
          Explore Programs
        </router-link>
        <router-link to="/about" class="btn-secondary text-center">
          About NTI
        </router-link>
      </div>
    </PageHero>

    <PageSection label="Programs" title="Two paths, one goal">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div class="card-glowing p-6 sm:p-8">
          <div class="inline-block bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1 px-3 rounded-full mb-5">
            Program A
          </div>
          <h3 class="text-2xl font-bold mb-3">Grant Incubation</h3>
          <p class="text-gray-400 text-sm leading-relaxed mb-6">
            Have your own idea? Build a startup with NTI funding, expert mentoring, and full technical support.
          </p>
          <ul class="flex flex-col gap-2 mb-8">
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              Min. 3 team members
            </li>
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              Quarterly evaluation rounds
            </li>
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              6 required documents
            </li>
          </ul>
          <router-link to="/programs/a" class="btn-link">
            Learn more →
          </router-link>
        </div>

        <div class="card-glowing p-6 sm:p-8">
          <div class="inline-block bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1 px-3 rounded-full mb-5">
            Program B
          </div>
          <h3 class="text-2xl font-bold mb-3">Live Practice</h3>
          <p class="text-gray-400 text-sm leading-relaxed mb-6">
            Work on real projects from companies. Get paid, gain experience, and build your portfolio with actual clients.
          </p>
          <ul class="flex flex-col gap-2 mb-8">
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              Real company projects
            </li>
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              Financial compensation
            </li>
            <li class="bullet-point">
              <span class="bullet-dot"></span>
              NTI mentor assigned
            </li>
          </ul>
          <router-link to="/programs/b" class="btn-link">
            Learn more →
          </router-link>
        </div>

      </div>
    </PageSection>
    
    <PageSection
      label="Opportunities"
      title="Active Calls & Deadlines"
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
        class="card-glowing p-8 text-center"
      >
        <p class="text-slate-400">
          There are currently no active calls.
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
            <div
              class="inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold tracking-wide uppercase"
              :class="statusClass(call.status)"
            >
              {{ call.status }}
            </div>

            <div class="text-xs text-slate-500 font-mono">
              {{ programLabel(call.program?.code) }}
            </div>
          </div>

          <h3 class="text-xl font-bold text-white mb-3 leading-snug">
            {{ call.name }}
          </h3>

          <p class="text-sm text-slate-400 leading-relaxed mb-6">
            Application deadline:
            <span class="text-white font-medium">
              {{ formatDeadline(call.deadline_at) }}
            </span>
          </p>

          <div class="flex items-center justify-between text-xs text-slate-500 mb-6">
            <span>
              Min team:
              <span class="text-slate-300">
                {{ call.min_team_size }}
              </span>
            </span>

            <span v-if="call.max_team_size">
              Max team:
              <span class="text-slate-300">
                {{ call.max_team_size }}
              </span>
            </span>
          </div>

          <router-link
            :to="`/calls/${call.id}`"
            class="btn-primary mt-auto text-center"
          >
            View Call
          </router-link>
        </div>
      </div>
    </PageSection>

    <PageSection label="News" title="Articles">
      <Articles />
    </PageSection>

    <CallToAction />

  </div>
</template>