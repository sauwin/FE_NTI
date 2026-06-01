<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../auth/stores/auth'
import { getCompanyProfile, updateCompanyProfile } from '@/features/company/api/company'
import type { CompanyProfile } from '@/features/company/types/company'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref(false)
const editMode = ref(false)
const isNew = ref(false)

const profile = ref<CompanyProfile>({ name: '', registration_number: '', sector: '', description: '', website: '' })

onMounted(async () => {
  if (!auth.isLoggedIn) { router.push('/auth/login'); return }
  try {
    const res = await getCompanyProfile()
    console.log(res.data)
    if (res.data && Object.keys(res.data).length) {
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
    await updateCompanyProfile(profile.value)
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
  <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
    <div v-for="n in 4" :key="n" class="border border-slate-800 rounded-2xl p-6 bg-slate-900/50">
      <div class="h-3 w-24 bg-slate-700 rounded mb-4"></div>
      <div class="h-6 w-48 bg-slate-800 rounded"></div>
    </div>
    <div class="sm:col-span-2 border border-slate-800 rounded-2xl p-6 bg-slate-900/50 h-32"></div>
  </div>

  <div v-else>
    <div v-if="isNew" class="border border-yellow-900/40 bg-yellow-950/20 rounded-xl p-4 mb-6 text-sm">
      <div class="font-semibold text-yellow-400 mb-1">Profile not filled in yet</div>
      <div class="text-slate-400">Fill in your company profile to submit projects.</div>
    </div>
    
    <div v-if="success" class="border border-green-900/40 bg-green-950/20 rounded-xl p-4 mb-6 text-sm">
      <span class="text-green-400 font-medium">Profile saved successfully</span>
    </div>
    
    <div v-if="error" class="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
      {{ error }}
    </div>

    <div v-if="!editMode" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 transition hover:border-slate-700">
          <div class="text-xs text-slate-500 uppercase font-mono mb-2">Company Name</div>
          <div class="text-xl font-bold text-white">{{ profile.name || '—' }}</div>
        </div>

        <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 transition hover:border-slate-700">
          <div class="text-xs text-slate-500 uppercase font-mono mb-2">Registration Number (IČO)</div>
          <div class="text-xl font-bold text-white font-mono">{{ profile.registration_number || '—' }}</div>
        </div>

        <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 transition hover:border-slate-700">
          <div class="text-xs text-slate-500 uppercase font-mono mb-2">Sector</div>
          <div class="text-xl font-bold text-white">{{ profile.sector || '—' }}</div>
        </div>

        <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 transition hover:border-slate-700">
          <div class="text-xs text-slate-500 uppercase font-mono mb-2">Website</div>
          <div class="text-xl font-bold">
            <a v-if="profile.website" :href="profile.website" target="_blank"
              class="text-blue-400 hover:text-blue-300 transition break-all border-b border-blue-500/30 hover:border-blue-400 pb-0.5">
              {{ profile.website }}
            </a>
            <span v-else class="text-slate-600">—</span>
          </div>
        </div>
      </div>

      <div v-if="profile.description" class="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
        <div class="text-xs text-slate-500 uppercase font-mono mb-3">Description</div>
        <div class="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{{ profile.description }}</div>
      </div>
    </div>

    <div v-else class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-2">Company Name <span class="text-red-400">*</span></label>
          <input v-model="profile.name" type="text" placeholder="e.g. TechCorp s.r.o."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-700 transition" />
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-2">Registration Number (IČO)</label>
          <input v-model="profile.registration_number" type="text" placeholder="12345678"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-700 transition font-mono" />
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-2">Sector</label>
          <input v-model="profile.sector" type="text" placeholder="e.g. Software Development"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-700 transition" />
        </div>
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-2">Website</label>
          <input v-model="profile.website" type="url" placeholder="https://example.com"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-700 transition" />
        </div>
      </div>
      <div>
        <label class="block text-xs font-mono uppercase text-slate-400 mb-2">Description</label>
        <textarea v-model="profile.description" rows="4" placeholder="Describe your company..."
          class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-700 transition resize-none"></textarea>
      </div>
    </div>

    <div class="mt-6 flex items-center justify-between border-t border-slate-900 pt-6">
      <div v-if="auth.roleInOrg === 'owner'" class="flex gap-3">
        <button v-if="!editMode" @click="editMode = true"
          class="text-xs px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition text-slate-300 font-medium">
          Edit Profile
        </button>
        <template v-else>
          <button v-if="!isNew" @click="editMode = false; error = ''"
            class="text-xs px-4 py-2 rounded-lg border border-slate-800 bg-transparent hover:bg-slate-900 transition text-slate-400 hover:text-slate-200">
            Cancel
          </button>
          <button @click="save" :disabled="saving"
            class="text-xs px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition shadow-sm shadow-blue-900/20">
            {{ saving ? 'Saving...' : (isNew ? 'Create Profile' : 'Save Changes') }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>