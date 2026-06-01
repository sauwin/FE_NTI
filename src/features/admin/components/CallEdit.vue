<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getAdminPrograms, getAdminCallById, updateAdminCall } from '@/features/admin/api/admin'
import type { AdminProgram, RequiredDocument } from '@/features/admin/types/admin'

interface CallDocumentRequirement extends RequiredDocument {
  id: string
}

const router = useRouter()
const route = useRoute()
const callId = route.params.id as string

const programs = ref<AdminProgram[]>([])
const loading = ref<boolean>(false)
const error = ref<string>('')

const programId = ref<number | null>(null)
const status = ref<'draft' | 'open' | 'closed' | 'archived'>('draft')
const opensAt = ref<string>('')
const deadlineAt = ref<string>('')
const minTeamSize = ref<number>(3)
const maxTeamSize = ref<number | null>(null)
const requiredDocuments = ref<CallDocumentRequirement[]>([])

const formatDateTime = (isoString: string | null) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toISOString().slice(0, 16)
}

onMounted(async () => {
  loading.value = true
  try {
    const progRes = await getAdminPrograms()
    programs.value = progRes.data

    const callRes = await getAdminCallById(callId)
    const call = callRes.data

    programId.value = call.program_id
    status.value = call.status
    opensAt.value = formatDateTime(call.opens_at)
    deadlineAt.value = formatDateTime(call.deadline_at)
    minTeamSize.value = call.min_team_size
    maxTeamSize.value = call.max_team_size
    requiredDocuments.value = call.required_documents || []
  } catch (e) {
    error.value = 'Failed to load data for this Call.'
  } finally {
    loading.value = false
  }
})

const addDocumentRule = () => {
  requiredDocuments.value.push({
    id: Date.now().toString(),
    document_name: '',
    is_mandatory: true,
    max_size_mb: 5
  })
}

const removeDocumentRule = (index: number) => {
  requiredDocuments.value.splice(index, 1)
}

async function updateCall() {
  if (requiredDocuments.value.some(d => !d.document_name.trim())) {
    error.value = 'Please provide names for all required documents.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await updateAdminCall(callId, {
      status: status.value,
      opens_at: opensAt.value ? new Date(opensAt.value).toISOString() : null,
      deadline_at: deadlineAt.value ? new Date(deadlineAt.value).toISOString() : null,
      min_team_size: minTeamSize.value,
      max_team_size: maxTeamSize.value,
      required_documents: requiredDocuments.value,
    })

    router.push('/admin/dashboard')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error updating Call configuration.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex justify-center items-center min-h-screen py-10 px-4">
    <div class="w-full max-w-2xl bg-slate-950 p-8 border border-blue-900 rounded-2xl">
      
      <div class="mb-6">
        <h1 class="font-bold text-3xl text-white">Edit Call Configuration</h1>
        <p class="text-gray-400 text-sm">Update lifecycle status, dates, and JSON schema</p>
      </div>

      <p v-if="error" class="text-red-500 text-sm bg-red-500/10 p-3 border border-red-900 rounded-md mb-4">{{ error }}</p>

      <div v-if="loading && !programs.length" class="text-white text-center py-4">Loading configurations...</div>

      <div v-else class="flex flex-col gap-5">
        <div>
          <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Target Core Program (Locked)</label>
          <select v-model="programId" disabled class="w-full bg-slate-900 border border-slate-800 rounded-md h-10 px-3 text-gray-500 opacity-60">
            <option v-for="prog in programs" :key="prog.id" :value="prog.id">
              {{ prog.code?.toUpperCase().replace('_', ' ') }} ({{ prog.title || prog.name || 'No Title' }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Call Lifecycle Status *</label>
          <div class="flex gap-4 mt-1">
            <label v-for="st in ['draft', 'open', 'closed', 'archived']" :key="st" class="flex items-center gap-2 text-white capitalize cursor-pointer">
              <input type="radio" :value="st" v-model="status" class="accent-blue-500" />
              <span :class="status === st ? 'text-blue-400 font-bold' : 'text-gray-400'">{{ st }}</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Min Team Size *</label>
            <input v-model.number="minTeamSize" type="number" min="1" class="w-full bg-slate-900 border border-blue-900 rounded-md h-10 px-3 text-white" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Max Team Size (Optional)</label>
            <input v-model.number="maxTeamSize" type="number" :min="minTeamSize" placeholder="No limit" class="w-full bg-slate-900 border border-blue-900 rounded-md h-10 px-3 text-white" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Opens At</label>
            <input v-model="opensAt" type="datetime-local" class="w-full bg-slate-900 border border-blue-900 rounded-md h-10 px-3 text-white" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase mb-1">Deadline At</label>
            <input v-model="deadlineAt" type="datetime-local" class="w-full bg-slate-900 border border-blue-900 rounded-md h-10 px-3 text-white" />
          </div>
        </div>

        <hr class="border-blue-900/40 my-2" />

        <div>
          <div class="flex justify-between items-center mb-3">
            <label class="block text-xs font-semibold text-gray-400 uppercase">Required Documents Config</label>
            <button type="button" @click="addDocumentRule" class="text-xs bg-blue-900/60 hover:bg-blue-800 text-blue-300 px-3 py-1 rounded border border-blue-700 transition">
              + Add Document Type
            </button>
          </div>

          <div class="flex flex-col gap-3 max-h-52 overflow-y-auto pr-1">
            <div v-for="(doc, index) in requiredDocuments" :key="doc.id" class="flex gap-2 items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
              <input v-model="doc.document_name" type="text" placeholder="e.g. CV, Pitch" class="flex-1 bg-slate-950 border border-blue-900/60 h-8 px-2 text-xs rounded text-white" />
              
              <div class="flex items-center gap-1 text-xs text-gray-400">
                <input v-model.number="doc.max_size_mb" type="number" min="1" class="w-12 bg-slate-950 border border-blue-900/60 h-8 text-center text-white rounded" />
                <span>MB</span>
              </div>

              <label class="flex items-center gap-1 text-xs text-gray-400 min-w-[80px] cursor-pointer">
                <input type="checkbox" v-model="doc.is_mandatory" class="accent-blue-500" />
                Mandatory
              </label>

              <button type="button" @click="removeDocumentRule(index)" class="text-red-400 hover:text-red-500 text-sm px-1">✕</button>
            </div>
          </div>
        </div>

        <div class="flex gap-4 mt-2 border-t border-slate-900 pt-4">
          <button type="button" @click="router.back()" class="w-1/3 border border-blue-900 text-gray-400 h-11 rounded-md text-sm hover:text-white transition">Cancel</button>
          <button type="button" @click="updateCall" :disabled="loading" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-11 rounded-md text-sm font-medium transition">
            {{ loading ? 'Saving...' : 'Update Call Settings' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>