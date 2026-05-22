<script setup lang="ts">
  import { ref } from 'vue'
  import StudentInvitations from './StudentInvitations.vue'
  import StudentTeam from './StudentTeam.vue'
  import StudentAplications from './StudentAplications.vue'

  const props = defineProps<{
    userRole?: string
  }>()

  const activeTab = ref('overview')
  const isTeamLeader = props.userRole === 'leader'
</script>

<template>
  <div class="p-6 bg-slate-950 min-h-screen text-slate-100">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-white mb-4">Student Administration</h2>

      <div class="flex flex-wrap gap-2 border-b border-slate-800">
        <button
          v-for="tab in [
            { id: 'overview', label: 'Overview' },
            { id: 'invitations', label: 'Team Invitations' },
            { id: 'team', label: 'Manage Team' },
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

    <!-- Overview Tab -->
    <div v-show="activeTab === 'overview'">
      <div class="section-label">Quick actions</div>
      <div class="flex gap-4 flex-wrap">
        <!-- <button @click="showTeamForm = !showTeamForm"
                class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition">
          Create team
        </button> -->
        <router-link to="/programs/a/upload"
                      class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition">
          Apply to Program A
        </router-link>
        <router-link to="/programs/b/upload"
                      class="border border-slate-700 hover:border-blue-700 text-gray-400 hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition">
          Apply to Program B
        </router-link>
        <router-link to="/profile"
                      class="border border-slate-700 hover:border-blue-700 text-gray-400 hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition">
          My Profile
        </router-link>
      </div>
    </div>

    <div v-show="activeTab === 'invitations'">
      <StudentInvitations />
    </div>

    <div v-show="activeTab === 'team'">
      <StudentTeam />
    </div>

    <div v-show="activeTab === 'aplications'">
      <StudentAplications />
    </div>
  </div>
</template>


<!-- <div>
  <div v-if="showTeamForm">
    <TeamForm @created="onTeamCreated" @cancel="showTeamForm = false" />
  </div>
  <TeamsList />
</div> -->