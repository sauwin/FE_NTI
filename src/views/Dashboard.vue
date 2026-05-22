<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import TeamForm from '../components/student/TeamForm.vue'
import TeamsList from '../components/student/TeamsList.vue'
import api from '../api/axios'

import StudentDashboard from '../components/student/StudentDashboard.vue'
import CompanyDashboard from '../components/company/CompanyDashboard.vue'
import AdminDashboard from '../components/admin/AdminDashboard.vue'

const router = useRouter()
const auth = useAuthStore()
const isAuthentified = ref(false)
const userObj = ref<User | null>(null)
const profileComplete = ref(true)
const roleApproved = ref(true)
const showTeamForm = ref(false)
const success = ref('')

type User = {
  email: string
  first_name?: string
  last_name?: string
  role_slug?: string
  status?: string
}
const applications = ref<any[]>([])
const error = ref('')

async function fetchData() {
  try {
    const res = await api.get('/auth/me')
    userObj.value = res.data
    isAuthentified.value = true
    const appRes = await api.get('/applications')
    applications.value = appRes.data
    // Check if role is approved (granted_by != null)
    const roleRes = await api.get('/auth/role-status')
    roleApproved.value = roleRes.data.approved

    // Check profile completeness per role
    if (res.data.role_slug === 'student') {
      try {
        const p = await api.get('/profile')
        profileComplete.value = !!p.data
      } catch { profileComplete.value = false }
    } else if (res.data.role_slug === 'mentor') {
      try {
        const p = await api.get('/mentor-profile')
        profileComplete.value = !!p.data
      } catch { profileComplete.value = false }
    } else if (res.data.role_slug === 'company') {
      try {
        const p = await api.get('/company-profile')
        profileComplete.value = !!p.data
      } catch { profileComplete.value = false }
    }
  } catch {
    isAuthentified.value = false
  }
}

async function logout() {
  try {
    await api.post('/auth/logout')
    auth.logout()
    router.push('/auth/login')
  } catch {
    error.value = 'Unable to log out'
  }
}

function onTeamCreated(team: any) {
  success.value = 'Team created successfully.'
  showTeamForm.value = false
  fetchData()
  setTimeout(() => (success.value = ''), 4500)
}

const profileRoute: Record<string, string> = {
  student: '/profile',
  mentor:  '/mentor-profile',
  company: '/company-profile',
}

onMounted(() => { fetchData() })
</script>

<template>
  <div class="container-main">
    <div class="bg-blue-950 absolute rounded-full h-96 w-96 -z-10 -right-20 -top-10"></div>

    <div v-if="!isAuthentified" class="flex flex-col items-center justify-center py-32 gap-4">
      <p class="text-gray-400 text-base">User is not logged in</p>
      <router-link to="/auth/login"
                   class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
        Go to Login
      </router-link>
    </div>

    <div v-else>

      <!-- Header -->
      <div class="mb-10">
        <div class="inline-flex items-center bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-5">
          Dashboard
        </div>
        <h1 class="font-bold text-5xl leading-tight mb-3">
          Welcome, <span class="text-blue-400">{{ userObj?.first_name ?? userObj?.email }}</span>
        </h1>
        <div class="flex items-center gap-3 mt-2">
          <span class="text-sm text-gray-500">{{ userObj?.email }}</span>
          <span class="text-slate-700">·</span>
          <span class="text-xs capitalize bg-blue-600/15 border border-blue-800 text-blue-400 px-2.5 py-0.5 rounded-full">
            {{ userObj?.role_slug ?? '—' }}
          </span>
          <span class="text-slate-700">·</span>
          <span :class="[
            'text-xs px-2.5 py-0.5 rounded-full border',
            userObj?.status === 'active'
              ? 'bg-green-900/30 border-green-800 text-green-400'
              : 'bg-yellow-900/30 border-yellow-800 text-yellow-400'
          ]">{{ userObj?.status ?? 'pending' }}</span>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="error" class="border border-red-800/50 bg-red-900/10 rounded-xl px-6 py-4 mb-8 flex items-center justify-between gap-4">
        <div class="text-sm text-red-400">{{ error }}</div>
        <button @click="error = ''" class="text-red-400 hover:text-red-300">×</button>
      </div>

      <div v-if="success" class="border border-green-800/50 bg-green-900/10 rounded-xl px-6 py-4 mb-8 flex items-center justify-between gap-4">
        <div class="text-sm text-green-400">{{ success }}</div>
        <button @click="success = ''" class="text-green-400 hover:text-green-300">×</button>
      </div>

      <!-- Role not approved banner -->
      <div v-if="!roleApproved"
           class="border border-orange-800/50 bg-orange-900/10 rounded-xl px-6 py-4 flex items-center justify-between gap-4 mb-8">
        <div>
          <div class="text-sm font-semibold text-orange-400 mb-1">Role pending approval</div>
          <div class="text-muted-sm">An NTI administrator will confirm your role. You will be notified by email.</div>
        </div>
      </div>

      <!-- Profile incomplete banner -->
      <div v-if="roleApproved && !profileComplete && userObj?.role_slug && ['student','mentor','company'].includes(userObj.role_slug)"
           class="border border-yellow-800/50 bg-yellow-900/10 rounded-xl px-6 py-4 flex items-center justify-between gap-4 mb-8">
        <div>
          <div class="text-sm font-semibold text-yellow-400 mb-1">Complete your profile</div>
          <div class="text-muted-sm">Fill in your profile before using the full platform</div>
        </div>
        <router-link :to="profileRoute[userObj!.role_slug!] ?? '/dashboard'"
                     class="bg-yellow-600 hover:bg-yellow-500 text-white px-5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap">
          Complete now
        </router-link>
      </div>

      <!-- Quick actions --><!--
      <section class="section-divider-md">
        <div class="section-label">Quick actions</div>
        <div class="flex gap-4 flex-wrap">
          <router-link
            v-if="userObj?.role_slug === 'student'"
            to="/programs/a/upload"
            class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition">
            Apply to Program A
          </router-link>
          <router-link
            v-if="userObj?.role_slug === 'student'"
            to="/programs/b/upload"
            class="border border-slate-700 hover:border-blue-700 text-gray-400 hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition">
            Apply to Program B
          </router-link>
          <button
            @click="logout"
            class="border border-slate-700 hover:border-red-900 text-gray-400 hover:text-red-400 px-6 py-3 rounded-lg text-sm font-medium transition ml-auto">
            Log out
          </button>
        </div>
      </section>-->

      <!-- Applications -->
      <section v-if="!['super_admin', 'nti_admin', 'company', 'student'].includes(userObj?.role_slug ?? '')">
        <div class="section-label">My Applications</div>
        <div v-if="applications.length === 0" class="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
          <p class="text-slate-500 text-sm">No applications yet.</p>
          <p class="text-slate-600 text-xs mt-1">Submit your first application to get started.</p>
        </div>
        <div v-else class="flex flex-col gap-3">
          <div v-for="app in applications" :key="app.id"
               class="border border-slate-800 rounded-xl px-6 py-4 bg-slate-900/30 flex items-center justify-between">
            <div>
              <span class="text-white text-sm font-medium">Program {{ app.program_type.toUpperCase() }}</span>
              <span class="text-slate-600 text-xs ml-3">#{{ app.id }}</span>
              <p class="text-slate-500 text-xs mt-1">{{ new Date(app.created_at).toLocaleDateString() }}</p>
            </div>
            <div class="flex items-center gap-3">
            <span :class="[
              'text-xs px-2.5 py-0.5 rounded-full border capitalize',
              app.status === 'approved' ? 'bg-green-900/30 border-green-800 text-green-400' :
              app.status === 'rejected' ? 'bg-red-900/30 border-red-800 text-red-400' :
              'bg-blue-900/30 border-blue-800 text-blue-400'
            ]">{{ app.status }}</span>
              <router-link :to="`/applications/${app.id}`" class="text-white text-sm font-medium hover:text-blue-400 transition">
                Program {{ app.program_type.toUpperCase() }} #{{ app.id }}
              </router-link>
            </div>
          </div>
        </div>
      </section>

      <!-- ── STUDENT ── -->
      <StudentDashboard v-if="userObj?.role_slug === 'student'"/>

      <!-- ── MENTOR ── -->
      <div v-else-if="userObj?.role_slug === 'mentor'">
        <section class="section-divider-md">
          <div class="section-label">Quick actions</div>
          <div class="flex gap-4 flex-wrap">
            <router-link to="/mentor-profile"
                         class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg text-sm font-medium transition">
              My Profile
            </router-link>
            <button @click="logout"
                    class="border border-slate-700 hover:border-red-900 text-gray-400 hover:text-red-400 px-6 py-3 rounded-lg text-sm font-medium transition ml-auto">
              Log out
            </button>
          </div>
        </section>
        <section>
          <div class="section-label">My Projects</div>
          <div class="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
            <p class="text-slate-500 text-sm">No projects assigned yet.</p>
          </div>
        </section>
      </div>

      <!-- ── COMPANY ── -->
      <CompanyDashboard v-if="userObj?.role_slug === 'company'"/>
      <!-- <div v-else-if="userObj?.role_slug === 'company'">
        <section class="section-divider-md mt-8">
          <div class="section-label">Quick actions</div>
          <div class="flex gap-4 flex-wrap">
            <router-link to="/company-profile"
                         class="border border-slate-700 hover:border-blue-700 text-gray-400 hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition">
              Company Profile
            </router-link>
          </div>
        </section>
        <section>
          <div class="section-label">My Tasks</div>
          <div class="border border-slate-800 rounded-2xl p-12 text-center bg-slate-900/30">
            <p class="text-slate-500 text-sm">No tasks submitted yet.</p>
          </div>
        </section>
      </div> -->

      <!-- ── ADMIN ── -->
      <AdminDashboard v-if="userObj?.role_slug === 'nti_admin' || userObj?.role_slug === 'super_admin'" :user-role="userObj?.role_slug" />
    </div>
  </div>
</template>