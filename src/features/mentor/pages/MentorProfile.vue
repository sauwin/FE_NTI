<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import api from '@/shared/api/axios'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref(false)
const editMode = ref(false)
const isNew = ref(false)
const newExpertise = ref('')

type Profile = {
  bio: string
  expertise_areas: string[]
  available: boolean
}

const profile = ref<Profile>({ bio: '', expertise_areas: [], available: true })

onMounted(async () => {
  if (!auth.isLoggedIn) { router.push('/auth/login'); return }
  try {
    const res = await api.get('/mentor-profile')
    if (res.data) {
      profile.value = {
        bio: res.data.bio ?? '',
        expertise_areas: res.data.expertise_areas ?? [],
        available: res.data.available ?? true,
      }
    } else {
      isNew.value = true; editMode.value = true
    }
  } catch {
    isNew.value = true; editMode.value = true
  } finally {
    loading.value = false
  }
})

function addExpertise() {
  const val = newExpertise.value.trim()
  if (val && !profile.value.expertise_areas.includes(val)) {
    profile.value.expertise_areas.push(val)
  }
  newExpertise.value = ''
}

function removeExpertise(i: number) {
  profile.value.expertise_areas.splice(i, 1)
}

async function save() {
  error.value = ''
  saving.value = true
  try {
    await api.put('/mentor-profile', {
      bio: profile.value.bio,
      expertise_areas: profile.value.expertise_areas,
      available: profile.value.available,
    })
    success.value = true
    editMode.value = false
    isNew.value = false
    setTimeout(() => success.value = false, 3000)
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="container-main">
    <div class="bg-blue-950 absolute rounded-full h-96 w-96 -z-10 -right-20 -top-10 blur-sm"></div>

    <div v-if="loading" class="text-slate-500 text-sm">Loading...</div>
    <div v-else>

      <div class="mb-10 flex items-start justify-between gap-6">
        <div>
          <button @click="router.push('/dashboard')"
            class="text-xs text-slate-500 hover:text-slate-300 transition mb-4 block">← Back to Dashboard</button>
          <div class="inline-flex items-center bg-blue-600/15 border border-blue-800 text-blue-400 text-xs font-bold tracking-widest uppercase py-1.5 px-4 rounded-full mb-4">
            Mentor Profile
          </div>
          <h1 class="font-bold text-5xl leading-tight">My <span class="text-blue-400">Profile</span></h1>
        </div>
        <div class="flex gap-3 pt-10">
          <button v-if="!editMode" @click="editMode = true"
            class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
            Edit Profile
          </button>
          <template v-else>
            <button v-if="!isNew" @click="editMode = false; error = ''"
              class="border border-slate-700 hover:border-slate-500 text-gray-400 hover:text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
              Cancel
            </button>
            <button @click="save" :disabled="saving"
              class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition">
              {{ saving ? 'Saving...' : (isNew ? 'Create Profile' : 'Save Changes') }}
            </button>
          </template>
        </div>
      </div>

      <div v-if="isNew" class="border border-yellow-800/50 bg-yellow-900/10 rounded-xl px-6 py-4 mb-8">
        <div class="text-sm font-semibold text-yellow-400 mb-1">Profile not filled in yet</div>
        <div class="text-muted-sm">Fill in your mentor profile to appear in the system</div>
      </div>
      <div v-if="success" class="border border-green-800/50 bg-green-900/10 rounded-xl px-6 py-3 mb-8">
        <span class="text-green-400 text-sm font-medium">Profile saved successfully</span>
      </div>
      <p v-if="error" class="text-red-400 text-sm mb-6">{{ error }}</p>

      <!-- VIEW -->
      <div v-if="!editMode" class="flex flex-col gap-10">
        <section>
          <div class="section-label">Info</div>
          <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex items-center justify-between mb-4">
            <div>
              <div class="label-hint">Availability</div>
              <div :class="profile.available ? 'text-green-400' : 'text-red-400'" class="font-medium text-sm">
                {{ profile.available ? 'Available for projects' : 'Not available' }}
              </div>
            </div>
            <div :class="['w-3 h-3 rounded-full', profile.available ? 'bg-green-500' : 'bg-red-500']"></div>
          </div>
          <div v-if="profile.bio" class="card">
            <div class="text-xs text-slate-500 uppercase tracking-wide mb-2">Bio</div>
            <div class="text-slate-300 text-sm leading-relaxed">{{ profile.bio }}</div>
          </div>
        </section>
        <section>
          <div class="section-label">Expertise</div>
          <div v-if="profile.expertise_areas.length" class="flex flex-wrap gap-2">
            <span v-for="area in profile.expertise_areas" :key="area"
              class="text-xs font-medium px-3 py-1.5 rounded-full border text-blue-400 bg-blue-900/30 border-blue-800">
              {{ area }}
            </span>
          </div>
          <div v-else class="text-slate-600 text-sm">No expertise areas added yet.</div>
        </section>
      </div>

      <!-- EDIT -->
      <div v-else class="flex flex-col gap-8">
        <section>
          <div class="section-label">Info</div>
          <div>
            <label class="label">Bio</label>
            <textarea v-model="profile.bio" rows="4" placeholder="Describe your background..."
              class="textarea"></textarea>
          </div>
          <div class="mt-4">
            <label class="flex items-center gap-3 cursor-pointer">
              <input v-model="profile.available" type="checkbox" class="accent-blue-500" />
              <span class="text-sm text-gray-300">Available for new projects</span>
            </label>
          </div>
        </section>
        <section>
          <div class="section-label">Expertise Areas</div>
          <div class="flex flex-wrap gap-2 mb-3">
            <span v-for="(area, i) in profile.expertise_areas" :key="area"
              class="text-xs font-medium px-3 py-1.5 rounded-full border text-blue-400 bg-blue-900/30 border-blue-800 flex items-center gap-1.5">
              {{ area }}
              <button @click="removeExpertise(i)" class="hover:text-red-400 transition">×</button>
            </span>
          </div>
          <div class="flex gap-2">
            <input v-model="newExpertise" type="text" placeholder="e.g. Machine Learning"
              @keydown.enter.prevent="addExpertise"
              class="bg-blue-600/10 border border-blue-900 rounded-md h-9 px-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 flex-1" />
            <button @click="addExpertise" type="button"
              class="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-md text-sm transition">Add</button>
          </div>
        </section>
      </div>

    </div>
  </div>
</template>