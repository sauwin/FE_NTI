<script setup lang="ts">
  import { ref } from 'vue'
  import StudentInvitations from '@/features/student/components/StudentInvitations.vue'
  import StudentAplications from '@/features/student/components/StudentAplications.vue'
  import TeamsList from './TeamsList.vue'
  import { useAuthStore } from '@/features/auth/stores/auth'

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
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-3xl font-bold text-white">Student Administration</h2>
        <span class="text-xs bg-blue-950 text-blue-400 border border-blue-900 px-3 py-1 rounded-full capitalize">
          Role: {{ userRole ?? 'Student' }}
        </span>
      </div>

      <div class="flex flex-wrap gap-2 border-b border-slate-800">
        <button
          v-for="tab in [
            { id: 'overview', label: 'Overview' },
            { id: 'invitations', label: 'Team Invitations' },
            { id: 'teams', label: 'Manage Teams' },
            { id: 'aplications', label: 'Manage Applications' },
          ]"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            activeTab === tab.id
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-400',
            'px-4 py-2 text-sm font-medium transition'
          ]"
        >{{ tab.label }}</button>
      </div>
    </div>

    <div v-show="activeTab === 'overview'" class="space-y-6">
      <div>
        <div class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick actions</div>
        <div class="flex gap-4 flex-wrap">
          <button 
            @click="quickCreateTeam"
            class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-600/10"
          >
            Create Team
          </button>
          <router-link to="/programs/a/upload"
                       class="border border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-200 px-6 py-3 rounded-lg text-sm font-medium transition">
            Apply to Program A
          </router-link>
          <router-link to="/programs/b/upload"
                       class="border border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-200 px-6 py-3 rounded-lg text-sm font-medium transition">
            Apply to Program B
          </router-link>
          <router-link to="/profile"
                       class="border border-slate-800 text-slate-400 hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition">
            My Profile
          </router-link>
        </div>
      </div>

      <div class="bg-gradient-to-r from-slate-900 to-slate-900/40 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
        <div class="p-2 bg-blue-500/10 rounded-lg text-blue-400 text-xl">💡</div>
        <div class="space-y-1">
          <h4 class="text-white font-medium text-sm">Incubation Program Rules</h4>
          <p class="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Remember that Program A require a minimum team size of <strong>3 members</strong>. 
            You can create a team right now, invite colleagues via email, and draft your core documentation.
          </p>
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'invitations'">
      <StudentInvitations />
    </div>

    <div v-show="activeTab === 'teams'">
      <TeamsList ref="teamsListRef" :current-user-id="currentUserId" />
    </div>

    <div v-show="activeTab === 'aplications'">
      <StudentAplications />
    </div>
  </div>
</template>