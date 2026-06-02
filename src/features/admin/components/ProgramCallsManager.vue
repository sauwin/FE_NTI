<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  getAdminPrograms,
  getAdminCalls,
  createAdminCall,
  updateAdminCall,
  updateAdminCallStatus,
  deleteAdminCall,
  exportCalls,
} from '@/features/admin/api/admin'
import type { AdminCall, AdminProgram, RequiredDocument } from '@/features/admin/types/admin'
import {useConfirm} from "@/shared/composables/useConfirm.ts";

const programADocs: RequiredDocument[] = [
  { document_name: 'Executive Summary', is_mandatory: true, max_size_mb: 10 },
  { document_name: 'Technical Architecture', is_mandatory: true, max_size_mb: 15 },
  { document_name: 'Roadmap', is_mandatory: true, max_size_mb: 5 },
  { document_name: 'Budget', is_mandatory: true, max_size_mb: 15 },
  { document_name: 'Risk Analysis', is_mandatory: true, max_size_mb: 15 },
  { document_name: 'Monetization Model', is_mandatory: true, max_size_mb: 15 }
]

const programBDocs: RequiredDocument[] = [
  { document_name: 'Technical Documentation', is_mandatory: true, max_size_mb: 20 },
  { document_name: 'Wireframes', is_mandatory: false, max_size_mb: 15 },
  { document_name: 'PDF Specifications', is_mandatory: true, max_size_mb: 10 },
  { document_name: 'Images', is_mandatory: false, max_size_mb: 20 },
  { document_name: 'Presentations', is_mandatory: false, max_size_mb: 20 }
]

const searchQuery = ref('')
const filterStatus = ref('')
const filterProgramType = ref('')
const programs = ref<AdminProgram[]>([])
const calls = ref<AdminCall[]>([])
const isSubmitting = ref(false)
const editingCallId = ref<number | null>(null)
const openMenuId = ref<number | null>(null)

const defaultCallState = {
  program_type: 'a',
  title: '',
  status: 'draft',
  opens_at: '',
  deadline_at: '',
  min_team_size: 1,
  max_team_size: 5,
  evaluation_criteria: [],
  required_documents: JSON.parse(JSON.stringify(programADocs)) as RequiredDocument[]
}

type CallState = typeof defaultCallState
const newCall = ref<CallState>(JSON.parse(JSON.stringify(defaultCallState)))

watch(() => newCall.value.program_type, (newType) => {
  if (!editingCallId.value) {
    if (newType === 'a') {
      newCall.value.required_documents = JSON.parse(JSON.stringify(programADocs))
    } else if (newType === 'b') {
      newCall.value.required_documents = JSON.parse(JSON.stringify(programBDocs))
    }
  }
})

const filteredCalls = computed(() => {
  return calls.value.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !filterStatus.value || c.status === filterStatus.value
    const program = programs.value.find(p => p.id === c.program_id)
    const currentCallType = program?.code === 'program_b' ? 'b' : 'a'
    const matchesProgramType = !filterProgramType.value || currentCallType === filterProgramType.value

    return matchesSearch && matchesStatus && matchesProgramType;
  })
})

function getProgramLabel(programId: number): string {
  const program = programs.value.find(p => p.id === programId)
  if (!program) return '—'
  if (program.code === 'program_a') return 'Program A'
  if (program.code === 'program_b') return 'Program B'
  return program.title || program.name || '—'
}

function addDocument() {
  newCall.value.required_documents.push({ document_name: '', is_mandatory: true, max_size_mb: 5 })
}

function removeDocument(index: number) {
  newCall.value.required_documents.splice(index, 1)
}

function toggleMenu(id: number) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function closeMenu() {
  openMenuId.value = null
}

const emit = defineEmits(['view-applications'])

async function loadData() {
  try {
    const [progRes, callRes] = await Promise.all([
      getAdminPrograms(),
      getAdminCalls(),
    ])
    programs.value = progRes.data
    calls.value = callRes.data
  } catch (e) {
    console.error('Error loading data', e)
  }
}

function editCall(call: AdminCall) {
  editingCallId.value = call.id
  closeMenu()
  const program = programs.value.find(p => p.id === call.program_id)

  let parsedDocs = defaultCallState.required_documents
  if (call.form_config) {
    try { parsedDocs = JSON.parse(call.form_config) } catch {}
  }

  newCall.value = {
    program_type: program?.code === 'program_b' ? 'b' : 'a',
    title: call.name,
    status: call.status,
    opens_at: call.opens_at ? call.opens_at.substring(0, 10) : '',
    deadline_at: call.deadline_at ? call.deadline_at.substring(0, 10) : '',
    min_team_size: call.min_team_size,
    max_team_size: call.max_team_size || 5,
    evaluation_criteria: [],
    required_documents: parsedDocs
  }

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEdit() {
  editingCallId.value = null
  newCall.value = JSON.parse(JSON.stringify(defaultCallState))
}

async function handleSubmitCall() {
  try {
    isSubmitting.value = true
    const payload = { ...newCall.value, form_config: JSON.stringify(newCall.value.required_documents) }

    if (editingCallId.value) {
      await updateAdminCall(editingCallId.value, payload)
      await useConfirm({
        title: 'Status change',
        message: 'Call updated successfully!',
        confirmText: 'Okay',
        danger: false,
      })
    } else {
      await createAdminCall(payload)
      await useConfirm({
        title: 'Status change',
        message: 'Call created successfully!',
        confirmText: 'Okay',
        danger: false,
      })
    }

    cancelEdit()
    loadData()
  } catch (e) {
    await useConfirm({
      title: 'Error',
      message: editingCallId.value ? 'Error updating call.' : 'Error creating call.',
      confirmText: 'Okay',
      danger: false,
    })
  } finally {
    isSubmitting.value = false
  }
}

async function updateCallStatus(id: number, status: string) {
  try {
    await updateAdminCallStatus(id, status)
    closeMenu()
    loadData()
  } catch {
    await useConfirm({
      title: 'Error',
      message: 'Failed to update status',
      confirmText: 'Okay',
      danger: false,
    })
  }
}

async function handleDeleteCall(id: number) {
  const confirmed = await useConfirm({
    title: 'Delete Call',
    message: 'Are you sure you want to delete this call?',
    confirmText: 'Delete Now',
    cancelText: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  try {
    await deleteAdminCall(id)
    closeMenu()
    loadData()
  } catch {
    await useConfirm({
      title: 'Error',
      message: 'Call cannot be deleted (only Draft).',
      confirmText: 'Okay',
      danger: false,
    })
  }
}

async function downloadCallsExport(format: 'csv' | 'xlsx' = 'xlsx') {
  try {
    const response = await exportCalls({
      format,
      status: filterStatus.value || undefined,
      program_type: filterProgramType.value || undefined,
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `calls_${filterStatus.value || 'all'}_type_${filterProgramType.value || 'all'}.${format}`)
    document.body?.appendChild(link)
    link.click()
    document.body?.removeChild(link)
  } catch {
    await useConfirm({
      title: 'Error',
      message: 'Failed to download export.',
      confirmText: 'Okay',
      danger: false,
    })
  }
}

function isProgramB(programId: number): boolean {
  const program = programs.value.find(p => p.id === programId)
  return program?.code === 'program_b'
}

onMounted(() => {
  loadData()
  document.addEventListener('click', closeMenu)
})
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
    <div class="xl:col-span-1 border border-slate-800 bg-slate-900/40 rounded-2xl p-6">
      <h3 class="text-xl font-bold text-white mb-6">
        {{ editingCallId ? 'Edit Program A Call' : 'New Program A Call' }}
      </h3>
      <form @submit.prevent="handleSubmitCall" class="space-y-4">
        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Call Title</label>
          <input type="text" v-model="newCall.title" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Opens At</label>
            <input type="date" v-model="newCall.opens_at" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Deadline</label>
            <input type="date" v-model="newCall.deadline_at" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Min Team</label>
            <input type="number" v-model="newCall.min_team_size" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-mono uppercase text-slate-400 mb-1">Max Team</label>
            <input type="number" v-model="newCall.max_team_size" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:border-blue-600 outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-mono uppercase text-slate-400 mb-2">Required Documents</label>
          <div class="space-y-3">
            <div v-for="(doc, index) in newCall.required_documents" :key="index" class="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <input v-model="doc.document_name" placeholder="Document Name" class="w-full bg-transparent border-b border-slate-700 mb-3 text-sm text-white focus:outline-none focus:border-blue-500" />
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" v-model="doc.is_mandatory" class="rounded bg-slate-900 border-slate-700 text-blue-600" /> Required
                </label>
                <div class="flex items-center gap-2">
                  <input v-model.number="doc.max_size_mb" type="number" class="w-12 bg-slate-800 rounded px-1 py-0.5 text-center text-xs text-white" />
                  <span class="text-xs text-slate-500">MB</span>
                  <button type="button" @click="removeDocument(index)" class="text-slate-600 hover:text-red-400 ml-2 transition-colors">✕</button>
                </div>
              </div>
            </div>
            <button type="button" @click="addDocument" class="w-full py-2 text-xs border border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition">
              + Add Document
            </button>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button v-if="editingCallId" type="button" @click="cancelEdit" class="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition text-sm">
            Cancel
          </button>
          <button type="submit" :disabled="isSubmitting" :class="editingCallId ? 'w-2/3' : 'w-full'" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm">
            {{ isSubmitting ? 'Saving...' : (editingCallId ? 'Update Call' : 'Create Call') }}
          </button>
        </div>
      </form>
    </div>

    <div class="xl:col-span-2 space-y-6">
      <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
        <div class="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h3 class="text-xl font-bold text-white">Calls</h3>
          <div class="ml-4 flex-shrink-0 gap-2 flex">
            <button @click="downloadCallsExport('csv')" :disabled="isSubmitting" class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono">
              Export CSV
            </button>
            <button @click="downloadCallsExport('xlsx')" :disabled="isSubmitting" class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono">
              Export XLSX
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search by title..." 
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-600 outline-none"
            />
          </div>
          <div>
            <select 
              v-model="filterStatus" 
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-600 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <select 
              v-model="filterProgramType" 
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-600 outline-none"
            >
              <option value="">All Program Types</option>
              <option value="a">Program A</option>
              <option value="b">Program B</option>
            </select>
          </div>
        </div>

        <div v-if="!filteredCalls.length" class="text-slate-500 italic text-sm py-6 text-center">No calls found.</div>

        <div v-else class="space-y-3">
          <div
            v-for="c in filteredCalls"
            :key="c.id"
            class="border border-slate-800 bg-slate-950 px-5 py-4 rounded-xl flex items-center justify-between gap-4"
          >
            <div class="flex-grow min-w-0">
              <p class="text-base font-semibold text-white truncate mb-2">{{ c.name }}</p>
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="text-xs font-mono px-2 py-1 rounded border"
                  :class="getProgramLabel(c.program_id) === 'Program A'
                    ? 'bg-blue-950/60 text-blue-400 border-blue-900'
                    : 'bg-slate-800 text-slate-400 border-slate-700'"
                >
                  {{ getProgramLabel(c.program_id) }}
                </span>

                <span
                  class="text-xs font-mono px-2 py-1 rounded border uppercase"
                  :class="{
                    'bg-emerald-950/60 text-emerald-400 border-emerald-900': c.status === 'open',
                    'bg-slate-800/80 text-slate-500 border-slate-700': c.status === 'closed',
                    'bg-slate-900 text-slate-600 border-slate-800': c.status === 'draft',
                    'bg-amber-950/40 text-amber-500 border-amber-900': c.status === 'archived',
                  }"
                >
                  {{ c.status }}
                </span>

                <span class="text-xs text-slate-500 font-mono">
                  {{ c.min_team_size }}–{{ c.max_team_size || '∞' }} members
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="emit('view-applications', c.id)"
                class="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-slate-300 transition-all font-mono whitespace-nowrap"
              >
                Applications
              </button>

              <div class="relative" @click.stop>
                <button
                  v-if="isProgramB(c.program_id)"
                  @click="toggleMenu(c.id)"
                  class="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-yellow-400 transition-all font-mono whitespace-nowrap"
                >
                  Archived
                </button>

                <button
                  v-if="!isProgramB(c.program_id)"
                  @click="toggleMenu(c.id)"
                  class="flex items-center justify-center w-8 h-8 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-sm leading-none"
                >
                  ···
                </button>

                <div
                  v-if="openMenuId === c.id"
                  class="absolute right-0 top-full mt-1.5 z-50 w-44 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden"
                >
                  <div class="py-1">
                    <button
                      v-if="c.status === 'draft'"
                      @click="editCall(c)"
                      class="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 transition"
                    >
                      Edit
                    </button>

                    <button
                      v-if="c.status !== 'draft'"
                      @click="updateCallStatus(c.id, 'draft')"
                      class="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800 transition"
                    >
                      Set Draft
                    </button>

                    <button
                      v-if="c.status !== 'open'"
                      @click="updateCallStatus(c.id, 'open')"
                      class="w-full text-left px-4 py-2.5 text-sm text-emerald-400 hover:bg-slate-800 transition"
                    >
                      Open
                    </button>

                    <button
                      v-if="c.status !== 'closed'"
                      @click="updateCallStatus(c.id, 'closed')"
                      class="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:bg-slate-800 transition"
                    >
                      Close
                    </button>

                    <button
                      v-if="c.status !== 'archived'"
                      @click="updateCallStatus(c.id, 'archived')"
                      class="w-full text-left px-4 py-2.5 text-sm text-yellow-400 hover:bg-slate-800 transition"
                    >
                      Archived
                    </button>

                    <button
                      v-if="!isProgramB(c.program_id)"
                      @click="handleDeleteCall(c.id)"
                      class="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>