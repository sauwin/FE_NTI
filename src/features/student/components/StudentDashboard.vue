<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth'

const StudentInvitations = defineAsyncComponent(() => import('@/features/student/components/StudentInvitations.vue'))
const StudentAplications = defineAsyncComponent(() => import('@/features/student/components/StudentAplications.vue'))
const TeamsList = defineAsyncComponent(() => import('./TeamsList.vue'))

const auth = useAuthStore()

const props = defineProps<{
  userRole?: string
}>()

const activeTab = ref('overview')
const currentUserId = ref(auth.user.id) 

const teamsListRef = ref<InstanceType<typeof TeamsList> | null>(null)

function quickCreateTeam() {
  activeTab.value = 'teams'
  setTimeout(() => {
    teamsListRef.value?.openForm()
  }, 50)
}
</script>

<template>
  <div class="p-6 bg-slate-950 min-h-screen text-slate-100">
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h2 class="text-3xl font-bold text-white">Student Administration</h2>
          <p class="text-sm text-slate-500 mt-2">
            Manage your incubator applications, collaborate with team members, and track your program progress.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button v-for="tab in [
          { id: 'overview', label: 'Overview' },
          { id: 'invitations', label: 'Team Invitations' },
          { id: 'teams', label: 'Manage Teams' },
          { id: 'aplications', label: 'Manage Applications' },
        ]"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          activeTab === tab.id
            ? 'bg-blue-600/15 border-blue-500 text-blue-400'
            : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700',
          'px-4 py-2 text-sm font-medium transition rounded-xl border'
        ]">
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'overview'" class="space-y-6">
      
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <div class="xl:col-span-2 border border-slate-800 bg-slate-900/40 rounded-2xl p-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-white">Quick Actions</h3>
            <p class="text-sm text-slate-500 mt-1">Accelerate your workflow by interacting with platform configurations directly.</p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              @click="quickCreateTeam"
              class="flex flex-col justify-between text-left p-4 rounded-xl border border-blue-900/40 bg-blue-950/20 hover:border-blue-500 transition-all group"
            >
              <div class="text-sm font-semibold text-blue-400 mb-1 group-hover:text-blue-300 transition-colors">Create Team</div>
              <div class="text-xs text-slate-400">Initialize a new workgroup and start inviting core team members via corporate email.</div>
            </button>

            <router-link to="/programs/a/upload"
              class="flex flex-col justify-between text-left p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all"
            >
              <div class="text-sm font-semibold text-white mb-1">Apply to Program A</div>
              <div class="text-xs text-slate-400">Submit your commercial project prototype, build roadmap metrics, and fill system forms.</div>
            </router-link>

            <router-link to="/programs/b/upload"
              class="flex flex-col justify-between text-left p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all"
            >
              <div class="text-sm font-semibold text-white mb-1">Apply to Program B</div>
              <div class="text-xs text-slate-400">Upload system documents, wireframes, code specifications, and product presentations.</div>
            </router-link>

            <router-link to="/profile"
              class="flex flex-col justify-between text-left p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all"
            >
              <div class="text-sm font-semibold text-slate-400 mb-1">My Profile</div>
              <div class="text-xs text-slate-500">Edit account metrics, change contact variables, or configure security parameters.</div>
            </router-link>
          </div>
        </div>

        <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <span class="p-2 bg-blue-500/10 text-blue-400 rounded-xl text-md leading-none">💡</span>
              <h3 class="text-lg font-semibold text-white">Incubation Rules</h3>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed space-y-2">
              Please strictly notice that Program A requires a minimum team size of 
              <strong class="text-blue-400 font-medium">3 verified members</strong> before you can legally push an application state to pending validation.
            </p>
            <div class="mt-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-500 leading-relaxed">
              You can spin up a team container right now, trigger instant system invites, and comfortably draft your platform files.
            </div>
          </div>
          <div class="w-full h-1 rounded-full bg-slate-800 overflow-hidden mt-6">
            <div class="w-1/3 h-full bg-blue-600 rounded-full"></div>
          </div>
        </div>
      </div>

    </div>

    <div v-if="activeTab === 'invitations'">
      <StudentInvitations />
    </div>

    <div v-if="activeTab === 'teams'">
      <TeamsList ref="teamsListRef" :current-user-id="currentUserId" />
    </div>

    <div v-if="activeTab === 'aplications'">
      <StudentAplications />
    </div>
  </div>
</template>