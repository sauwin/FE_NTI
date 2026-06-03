<script setup lang="ts">
import { ref, computed } from 'vue'
import { createAdmin as createAdminUser } from '@/features/admin/api/admin'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits(['created'])

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: ''
})
const loading = ref(false)
const message = ref('')
const success = ref(false)

// Made dynamic and computed to adapt automatically on runtime locale changes
const adminRoles = computed(() => ({
  nti_admin: t('admin.createAdminForm.roles.ntiAdmin'), 
  evaluator: t('admin.createAdminForm.roles.evaluator'), 
  content_editor: t('admin.createAdminForm.roles.contentEditor'), 
  mentor: t('admin.createAdminForm.roles.mentor')
}))

async function createAdmin() {
  if (!form.value.first_name || !form.value.last_name || !form.value.email || !form.value.password) {
    message.value = t('admin.createAdminForm.messages.allFieldsRequired')
    success.value = false
    return
  }

  if (form.value.password.length < 8) {
    message.value = t('admin.createAdminForm.messages.passwordMinLength')
    success.value = false
    return
  }

  loading.value = true
  try {
    await createAdminUser({
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      password: form.value.password,
      role: form.value.role,
    })
    success.value = true
    message.value = t('admin.createAdminForm.messages.success')
    form.value = { first_name: '', last_name: '', email: '', password: '', role: '' }
    emit('created')
    setTimeout(() => { success.value = false; message.value = '' }, 3000)
  } catch (e: any) {
    success.value = false
    message.value = e.response?.data?.message || t('admin.createAdminForm.messages.failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-4rem)] w-full p-4">
    <div class="border border-slate-800 bg-slate-900/40 rounded-2xl p-6 max-w-md">
      <h3 class="text-xl font-bold text-white mb-6">
        {{ t('admin.createAdminForm.title') }}
      </h3>

      <form @submit.prevent="createAdmin" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">
              {{ t('admin.createAdminForm.fields.firstName') }}
            </label>
            <input
              v-model="form.first_name"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-600 outline-none transition"
            />
          </div>
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">
              {{ t('admin.createAdminForm.fields.lastName') }}
            </label>
            <input
              v-model="form.last_name"
              type="text"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-600 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">
            {{ t('admin.createAdminForm.fields.email') }}
          </label>
          <input
            v-model="form.email"
            type="email"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-600 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">
            {{ t('admin.createAdminForm.fields.password') }}
          </label>
          <input
            v-model="form.password"
            type="password"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-600 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">
            {{ t('admin.createAdminForm.fields.adminRole') }}
          </label>
          <select
            v-model="form.role"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm focus:border-blue-600 outline-none transition"
          >
            <option value="" disabled>
              {{ t('admin.createAdminForm.fields.selectRole') }}
            </option>
            <option v-for="(label, key) in adminRoles" :key="key" :value="key" class="bg-slate-950 text-white">
              {{ label }}
            </option>
          </select>
        </div>

        <div
          v-if="message"
          class="px-4 py-3 rounded-xl text-sm font-mono border"
          :class="success
            ? 'bg-emerald-950/60 border-emerald-900 text-emerald-400'
            : 'bg-red-950/40 border-red-900 text-red-400'"
        >
          {{ message }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
        >
          {{ loading ? t('admin.createAdminForm.buttons.creating') : t('admin.createAdminForm.buttons.create') }}
        </button>
      </form>
    </div>
  </div>
</template>