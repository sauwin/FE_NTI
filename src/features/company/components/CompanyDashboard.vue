<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import CompanyProfile from './CompanyProfile.vue'
import CompanyTasks from './CompanyTasks.vue'
import ActiveMembersTable from './ActiveMembersTable.vue'
import PendingApprovalsTable from './PendingApprovalsTable.vue'

import MentorshipsTable from '@/features/mentor/components/MentorshipsTable.vue'
import ProjectDetail from '@/features/mentor/components/ProjectDetail.vue'
import { getMentorships } from '@/features/mentor/api/mentorships'
import type { Mentorship } from '@/features/mentor/types/mentorships'

import EvaluatorPendingTable from '@/features/evaluation/components/EvaluatorPendingTable.vue'
import EvaluatorCompletedTable from '@/features/evaluation/components/EvaluatorCompletedTable.vue'
import { getEvaluatorApplications, getMyEvaluations } from '@/features/evaluation/api/evaluations'

import {
  getPendingMembers,
  getActiveMembers,
  approveMember,
  rejectMember,
  kickMember,
} from '@/features/company/api/company'
import type { CompanyUser } from '@/features/company/types/company'
import { useConfirm as confirm } from '../../../shared/composables/useConfirm'

const props = defineProps<{
  roleInOrg?: string
}>()

type AdminTab =
  | 'company-info'
  | 'project-tasks'
  | 'members'
  | 'approvals'
  | 'mentor-projects'
  | 'evaluator-pending'  
  | 'evaluator-completed'

const activeTab = ref<AdminTab>('company-info')
const pendingUsers = ref<CompanyUser[]>([])
const activeMembers = ref<CompanyUser[]>([])
const loadingMembers = ref(false)

const mentorships = ref<Mentorship[]>([])
const loadingMentor = ref(false)
const selectedMentorship = ref<Mentorship | null>(null)

const evaluatorApps = ref<any[]>([])
const myEvaluations = ref<any[]>([])
const loadingEvaluator = ref(false)
const filterProgram = ref<'all' | 'a' | 'b'>('all')

const handleTabChange = (tab: AdminTab) => {
  activeTab.value = tab

  if (tab === 'members') {
    fetchMembersData()
  } else if (tab === 'mentor-projects') {
    fetchMentorData()
  } else if (tab === 'evaluator-pending' || tab === 'evaluator-completed') {
    fetchEvaluatorData()
  }
}

async function fetchMembersData() {
  loadingMembers.value = true
  try {
    const [pRes, aRes] = await Promise.all([getPendingMembers(), getActiveMembers()])
    pendingUsers.value = pRes.data || []
    activeMembers.value = aRes.data || []
  } catch (e) { console.error(e) } {
    loadingMembers.value = false
  }
}

async function fetchMentorData() {
  loadingMentor.value = true
  try {
    const res = await getMentorships()
    mentorships.value = res.data || []
  } catch (err) { console.error(err) } finally {
    loadingMentor.value = false
  }
}

async function fetchEvaluatorData() {
  loadingEvaluator.value = true
  try {
    const [appsRes, evalsRes] = await Promise.all([
      getEvaluatorApplications(),
      getMyEvaluations()
    ])
    evaluatorApps.value = appsRes.data?.data ?? appsRes.data ?? []
    myEvaluations.value = evalsRes.data?.data ?? evalsRes.data ?? []
  } catch (err) { console.error(err) } finally {
    loadingEvaluator.value = false
  }
}

function hasEvaluated(appId: number) {
  return myEvaluations.value.some((e: any) => e.application_id === appId)
}

const mentorRequests = computed(() => mentorships.value.filter(m => m.application?.status === 'onboarding'))
const activeMentorships = computed(() => mentorships.value.filter(m => m.application?.status !== 'onboarding'))

const filteredPendingEvaluations = computed(() => {
  return evaluatorApps.value.filter(app => !hasEvaluated(app.id) && (filterProgram.value === 'all' || app.program === filterProgram.value))
})

const filteredCompletedEvaluations = computed(() => {
  return evaluatorApps.value.filter(app => hasEvaluated(app.id) && (filterProgram.value === 'all' || app.program === filterProgram.value))
})

async function handleApprove(user: CompanyUser) {
  const ok = await confirm({ 
    title: 'Approve Member', 
    message: `Are you sure you want to approve ${user.first_name}?` 
  })
  if (!ok) return

  try {
    await approveMember(user.id)
    fetchMembersData()
  } catch (e) { console.error(e) }
}

async function handleReject(user: CompanyUser) {
  const ok = await confirm({ 
    title: 'Reject Request', 
    message: `Reject request from ${user.first_name}?`, 
    confirmText: 'Reject', 
    danger: true,
  })
  if (!ok) return

  try {
    await rejectMember(user.id)
    fetchMembersData()
  } catch (e) { console.error(e) }
}

async function handleKick(user: CompanyUser) {
  const ok = await confirm({ 
    title: 'Remove Member', 
    message: `Remove ${user.first_name} from organization?`, 
    confirmText: 'Remove', 
    danger: true, 
  })
  if (!ok) return

  try {
    await kickMember(user.id)
    fetchMembersData()
  } catch (e) { console.error(e) }
}

onMounted(() => {
  if (props.roleInOrg === 'owner') {
    fetchMembersData()
  }
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
      <div class="flex flex-wrap gap-2">
        <button @click="handleTabChange('company-info')" :class="[activeTab === 'company-info' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Company Profile
        </button>
        
        <button @click="handleTabChange('project-tasks')" :class="[activeTab === 'project-tasks' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Project Tasks
        </button>

        <button @click="handleTabChange('approvals')" v-if="roleInOrg === 'owner'" :class="[activeTab === 'approvals' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Manage Pending Approvals
        </button>
        
        <button @click="handleTabChange('members')" v-if="roleInOrg === 'owner'" :class="[activeTab === 'members' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Manage Company Members
        </button>

        <button @click="handleTabChange('mentor-projects')" v-if="roleInOrg === 'mentor'" :class="[activeTab === 'mentor-projects' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Mentorship Work
        </button>

        <button @click="handleTabChange('evaluator-pending')" v-if="roleInOrg === 'evaluator'" :class="[activeTab === 'evaluator-pending' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Awaiting Evaluation
        </button>

        <button @click="handleTabChange('evaluator-completed')" v-if="roleInOrg === 'evaluator'" :class="[activeTab === 'evaluator-completed' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-slate-700', 'px-4 py-2 text-sm font-medium transition rounded-xl border']">
          Evaluation History
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'project-tasks'"><CompanyTasks /></div>
    <div v-show="activeTab === 'company-info'"><CompanyProfile /></div>

    <div v-show="activeTab === 'approvals' && roleInOrg === 'owner'" class="space-y-10">
      <PendingApprovalsTable :pending-users="pendingUsers" :loading="loadingMembers" @approve="handleApprove" @reject="handleReject" />
    </div>

    <div v-show="activeTab === 'members' && roleInOrg === 'owner'">
      <ActiveMembersTable :active-members="activeMembers" :loading="loadingMembers" @kick="handleKick" @refresh="fetchMembersData" />
    </div>

    <div v-show="activeTab === 'mentor-projects' && roleInOrg === 'mentor'" class="space-y-6">
      <div v-if="selectedMentorship">
        <button @click="selectedMentorship = null" class="mb-4 text-xs font-mono text-slate-400 hover:text-white transition">&larr; Back to list</button>
        <ProjectDetail :mentorship="selectedMentorship" @refresh="fetchMentorData(); selectedMentorship = null" />
      </div>
      <div v-else class="space-y-6">
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Onboarding Requests</h3>
          <MentorshipsTable :mentorships="mentorRequests" :loading="loadingMentor" :error="''" :is-request-mode="true" @view-project="selectedMentorship = $event" />
        </div>
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Active Incubating Projects</h3>
          <MentorshipsTable :mentorships="activeMentorships" :loading="loadingMentor" :error="''" :is-request-mode="false" @view-project="selectedMentorship = $event" />
        </div>
      </div>
    </div>

    <div v-show="(activeTab === 'evaluator-pending' || activeTab === 'evaluator-completed') && roleInOrg === 'evaluator'" class="space-y-4">
      <div class="flex items-center gap-3 bg-slate-900/20 border border-slate-800 p-4 rounded-xl mb-2">
        <span class="text-xs font-mono uppercase text-slate-500">Program:</span>
        <div class="flex gap-1.5">
          <button v-for="p in ['all', 'a', 'b'] as const" :key="p" @click="filterProgram = p" :class="['text-xs px-3 py-1.5 font-mono uppercase border rounded-lg transition', filterProgram === p ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700']">
            {{ p === 'all' ? 'Všetky' : `Program ${p}` }}
          </button>
        </div>
      </div>

      <div v-show="activeTab === 'evaluator-pending'">
        <EvaluatorPendingTable :applications="filteredPendingEvaluations" :loading="loadingEvaluator" />
      </div>

      <div v-show="activeTab === 'evaluator-completed'">
        <EvaluatorCompletedTable :applications="filteredCompletedEvaluations" :loading="loadingEvaluator" />
      </div>
    </div>
  </div>
</template>