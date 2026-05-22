<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../api/axios'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref(false)
const editMode = ref(false)
const isNew = ref(false)

type Profile = {
  name: string
  registration_number: string
  sector: string
  description: string
  website: string
}

const profile = ref<Profile>({ name: '', registration_number: '', sector: '', description: '', website: '' })

onMounted(async () => {
  if (!auth.isLoggedIn) { router.push('/auth/login'); return }
  try {
    const res = await api.get('/company-profile')
    if (res.data) {
      profile.value = {
        name: res.data.name ?? '',
        registration_number: res.data.registration_number ?? '',
        sector: res.data.sector ?? '',
        description: res.data.description ?? '',
        website: res.data.website ?? '',
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

async function save() {
  error.value = ''
  if (!profile.value.name.trim()) { error.value = 'Company name is required'; return }
  saving.value = true
  try {
    await api.put('/company-profile', profile.value)
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
  <div v-if="loading" class="text-slate-500 text-sm">Loading...</div>
  <div v-else>

    <div v-if="isNew" class="border border-yellow-800/50 bg-yellow-900/10 rounded-xl px-6 py-4 mb-8">
      <div class="text-sm font-semibold text-yellow-400 mb-1">Profile not filled in yet</div>
      <div class="text-muted-sm">Fill in your company profile to submit projects</div>
    </div>
    <div v-if="success" class="border border-green-800/50 bg-green-900/10 rounded-xl px-6 py-3 mb-8">
      <span class="text-green-400 text-sm font-medium">Profile saved successfully</span>
    </div>
    <p v-if="error" class="text-red-400 text-sm mb-6">{{ error }}</p>

    <!-- VIEW -->
    <div v-if="!editMode" class="flex flex-col gap-10">
      <section>
        <div class="grid grid-cols-2 gap-4">
          <div class="card">
            <div class="label-hint">Company Name</div>
            <div class="text-white font-medium">{{ profile.name || '—' }}</div>
          </div>
          <div class="card">
            <div class="label-hint">Registration Number</div>
            <div class="text-white font-medium">{{ profile.registration_number || '—' }}</div>
          </div>
          <div class="card">
            <div class="label-hint">Sector</div>
            <div class="text-white font-medium">{{ profile.sector || '—' }}</div>
          </div>
          <div class="card">
            <div class="label-hint">Website</div>
            <a v-if="profile.website" :href="profile.website" target="_blank"
              class="text-blue-400 hover:text-blue-300 text-sm transition break-all">
              {{ profile.website }}
            </a>
            <div v-else class="text-slate-500">—</div>
          </div>
        </div>
        <div v-if="profile.description" class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mt-4">
          <div class="text-xs text-slate-500 uppercase tracking-wide mb-2">Description</div>
          <div class="text-slate-300 text-sm leading-relaxed">{{ profile.description }}</div>
        </div>
      </section>
    </div>

    <!-- EDIT -->
    <div v-else class="flex flex-col gap-6">
      <section>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Company Name <span class="text-error">*</span></label>
            <input v-model="profile.name" type="text" placeholder="e.g. TechCorp s.r.o."
              class="input" />
          </div>
          <div>
            <label class="label">Registration Number (IČO)</label>
            <input v-model="profile.registration_number" type="text" placeholder="12345678"
              class="input" />
          </div>
          <div>
            <label class="label">Sector</label>
            <input v-model="profile.sector" type="text" placeholder="e.g. Software Development"
              class="input" />
          </div>
          <div>
            <label class="label">Website</label>
            <input v-model="profile.website" type="url" placeholder="https://example.com"
              class="input" />
          </div>
        </div>
        <div class="mt-4">
          <label class="label">Description</label>
          <textarea v-model="profile.description" rows="4" placeholder="Describe your company..."
            class="textarea"></textarea>
        </div>
      </section>
    </div>

    <div class="mb-10 flex items-start justify-between gap-6">
      <div v-if="auth.roleInOrg=='owner'" class="flex gap-3 pt-10">
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
  </div>
</template>