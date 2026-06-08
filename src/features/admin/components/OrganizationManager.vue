<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  getAdminCompanies,
  approveCompany,
  rejectCompany,
  activateCompany,
  deactivateCompany,
  deleteCompany,
  exportCompanies,
  updateCompanyPartnerStatus,
} from '@/features/admin/api/admin'
import { useConfirm } from '@/shared/composables/useConfirm'
import Pagination from '@/shared/components/Pagination.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{ isSuperAdmin?: boolean }>()
const emit = defineEmits(['refresh'])

const companies = ref<any[]>([])
const loading = ref(false)
const message = ref('')
const success = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const searchNameQuery = ref('')
const searchNumberQuery = ref('')
const selectedStatus = ref('')

const showDetailsModal = ref(false)
const selectedCompany = ref<any>(null)

const updatingStatusIds = ref<number[]>([])

async function loadCompanies() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value }
    
    if (searchNameQuery.value) params.search_name = searchNameQuery.value
    if (searchNumberQuery.value) params.search_number = searchNumberQuery.value
    if (selectedStatus.value) params.status = selectedStatus.value
    
    const res = await getAdminCompanies(params)
    if (res.data?.data) {
      companies.value = res.data.data
      currentPage.value = res.data.current_page
      totalPages.value = res.data.last_page
      totalItems.value = res.data.total
    } else {
      companies.value = Array.isArray(res.data) ? res.data : []
      totalPages.value = 1
      totalItems.value = companies.value.length
    }
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.companyManagement.messages.loadFailed'))
  } finally {
    loading.value = false
  }
}

async function handleTogglePublicPartner(company: any) {
  const targetValue = company.is_public_partner === 1 ? 0 : 1
  const companyId = company.id
  
  updatingStatusIds.value.push(companyId)
  
  try {
    await updateCompanyPartnerStatus(companyId, { is_public_partner: targetValue })

    const foundCompany = companies.value.find(c => c.id === companyId)
    if (foundCompany) {
      foundCompany.is_public_partner = targetValue
    }

    if (selectedCompany.value && selectedCompany.value.id === companyId) {
      selectedCompany.value.is_public_partner = targetValue
    }
    
    setMessage(true, t('admin.companyManagement.messages.statusUpdated'))
    emit('refresh')
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.companyManagement.messages.statusUpdateFailed'))
    
    await loadCompanies() 
    
    if (selectedCompany.value && selectedCompany.value.id === companyId) {
      const refreshedCompany = companies.value.find(c => c.id === companyId)
      if (refreshedCompany) {
        selectedCompany.value = refreshedCompany
      }
    }
  } finally {
    updatingStatusIds.value = updatingStatusIds.value.filter(id => id !== companyId)
  }
}

function handleFilterChange() {
  currentPage.value = 1
  loadCompanies()
}

function setMessage(ok: boolean, text: string) {
  success.value = ok
  message.value = text
  setTimeout(() => { message.value = '' }, 3000)
}

function openDetails(company: any) {
  selectedCompany.value = company
  showDetailsModal.value = true
}

async function handleApproveCompany(id: number) {
  if (!await useConfirm({ 
    title: t('admin.companyManagement.confirm.approveTitle'), 
    message: t('admin.companyManagement.confirm.approveMessage'), 
    confirmText: t('admin.companyManagement.actions.approve'), 
    cancelText: t('admin.companyManagement.modal.cancel'), 
    danger: false 
  })) return

  loading.value = true
  try {
    await approveCompany(id)
    setMessage(true, t('admin.companyManagement.messages.approved'))
    emit('refresh')
    loadCompanies()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.companyManagement.messages.approveFailed'))
  } finally { loading.value = false }
}

async function handleRejectCompany(id: number) {
  if (!await useConfirm({ 
    title: t('admin.companyManagement.confirm.rejectTitle'), 
    message: t('admin.companyManagement.confirm.rejectMessage'), 
    confirmText: t('admin.companyManagement.actions.reject'), 
    cancelText: t('admin.companyManagement.modal.cancel'), 
    danger: true 
  })) return

  loading.value = true
  try {
    await rejectCompany(id)
    setMessage(true, t('admin.companyManagement.messages.rejected'))
    emit('refresh')
    loadCompanies()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.companyManagement.messages.rejectFailed'))
  } finally { loading.value = false }
}

async function handleDeactivateCompany(id: number) {
  if (!await useConfirm({ 
    title: t('admin.companyManagement.confirm.deactivateTitle'), 
    message: t('admin.companyManagement.confirm.deactivateMessage'), 
    confirmText: t('admin.companyManagement.actions.deactivate'), 
    cancelText: t('admin.companyManagement.modal.cancel'), 
    danger: true 
  })) return

  loading.value = true
  try {
    await deactivateCompany(id)
    setMessage(true, t('admin.companyManagement.messages.deactivated'))
    emit('refresh')
    loadCompanies()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.companyManagement.messages.deactivateFailed'))
  } finally { loading.value = false }
}

async function handleActivateCompany(id: number) {
  if (!await useConfirm({ 
    title: t('admin.companyManagement.confirm.activateTitle'), 
    message: t('admin.companyManagement.confirm.activateMessage'), 
    confirmText: t('admin.companyManagement.actions.activate'), 
    cancelText: t('admin.companyManagement.modal.cancel'), 
    danger: false 
  })) return

  loading.value = true
  try {
    await activateCompany(id)
    setMessage(true, t('admin.companyManagement.messages.activated'))
    emit('refresh')
    loadCompanies()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.companyManagement.messages.activateFailed'))
  } finally { loading.value = false }
}

async function handleDeleteCompany(id: number) {
  if (!await useConfirm({ 
    title: t('admin.companyManagement.confirm.deleteTitle'), 
    message: t('admin.companyManagement.confirm.deleteMessage'), 
    confirmText: t('admin.companyManagement.actions.delete'), 
    cancelText: t('admin.companyManagement.modal.cancel'), 
    danger: true 
  })) return

  loading.value = true
  try {
    await deleteCompany(id)
    setMessage(true, t('admin.companyManagement.messages.deleted'))
    emit('refresh')
    loadCompanies()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.companyManagement.messages.deleteFailed'))
  } finally { loading.value = false }
}

async function handleExportCompanies(format: 'csv' | 'xlsx' = 'csv') {
  loading.value = true
  try {
    const response = await exportCompanies({
      search_name: searchNameQuery.value || undefined,
      search_number: searchNumberQuery.value || undefined,
      status: selectedStatus.value || undefined,
      format,
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `companies_export_${new Date().toISOString().split('T')[0]}.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setMessage(true, t('admin.companyManagement.messages.exportSuccess', { format: format.toUpperCase() }))
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.companyManagement.messages.exportFailed', { format: format.toUpperCase() }))
  } finally { loading.value = false }
}

let timeout: number

watch([searchNameQuery, searchNumberQuery], () => {
  clearTimeout(timeout)

  timeout = window.setTimeout(() => {
    handleFilterChange()
  }, 500)
})

watch(selectedStatus, () => {
  handleFilterChange()
})

onMounted(loadCompanies)
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6">
    
    <div v-if="message" :class="[
      'p-3 rounded-lg text-sm mb-6 border',
      success
        ? 'bg-green-900/20 border-green-800 text-green-400'
        : 'bg-red-900/20 border-red-800 text-red-400'
    ]">
      {{ message }}
    </div>

    <div class="flex flex-col gap-4 mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="text-xl font-bold text-white">{{ t('admin.companyManagement.title') }}</h3>
          <p class="text-sm text-slate-500 mt-1">
            {{ t('admin.companyManagement.description') }}
          </p>
        </div>

        <div class="flex-shrink-0 gap-2 flex">
          <button
            @click="handleExportCompanies('csv')"
            :disabled="loading"
            class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono cursor-pointer"
          >
            {{ t('admin.companyManagement.exportCsv') }}
          </button>

          <button
            @click="handleExportCompanies('xlsx')"
            :disabled="loading"
            class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono cursor-pointer"
          >
            {{ t('admin.companyManagement.exportXlsx') }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center w-full">
        <div class="sm:col-span-4 md:col-span-2 flex flex-col sm:flex-row gap-3 w-full">
          <input
            v-model="searchNameQuery"
            :placeholder="t('admin.companyManagement.searchNamePlaceholder')"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
          />

          <input
            v-model="searchNumberQuery"
            :placeholder="t('admin.companyManagement.searchNumberPlaceholder')"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
          />
        </div>

        <div>
          <select
            v-model="selectedStatus"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer"
          >
            <option value="">{{ t('admin.companyManagement.allStatuses') }}</option>
            <option value="active">{{ t('admin.companyManagement.statusActive') }}</option>
            <option value="pending">{{ t('admin.companyManagement.statusPending') }}</option>
            <option value="inactive">{{ t('admin.companyManagement.statusInactive') }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-slate-500 animate-pulse py-4 font-mono text-sm">
      {{ t('admin.companyManagement.loadingCompanies') }}
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
          <tr>
            <th class="px-4 py-3 rounded-tl-lg">{{ t('admin.companyManagement.tableHeaders.company') }}</th>
            <th class="px-4 py-3">{{ t('admin.companyManagement.tableHeaders.registrationNumber') }}</th>
            <th class="px-4 py-3">{{ t('admin.companyManagement.tableHeaders.status') }}</th>
            <th class="px-4 py-3 text-center">{{ t('admin.companyManagement.tableHeaders.publicPartner') }}</th>
            <th class="px-4 py-3 rounded-tr-lg text-right">{{ t('admin.companyManagement.tableHeaders.actions') }}</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="company in companies"
            :key="company.id"
            class="border-b border-slate-800 hover:bg-slate-800/30 transition"
          >
            <td class="px-4 py-3">
              <div class="font-semibold text-white text-sm">
                {{ company.name }}
              </div>
              <div v-if="company.website" class="text-xs text-blue-400 font-mono mt-0.5">
                <a :href="company.website" target="_blank" class="hover:underline">{{ company.website }}</a>
              </div>
            </td>

            <td class="px-4 py-3 font-mono text-xs">
              {{ company.registration_number || '—' }}
            </td>

            <td class="px-4 py-3">
              <span
                :class="[
                  'text-xs px-2 py-1 rounded border font-mono uppercase whitespace-nowrap',
                  company.status === 'active' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800' : '',
                  company.status === 'pending' ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800' : '',
                  company.status === 'inactive' ? 'bg-rose-900/40 text-rose-400 border-rose-800' : '',
                ]"
              >
                {{ t(`admin.companyManagement.status.${company.status}`) }}
              </span>
            </td>

            <td class="px-4 py-3 text-center">
              <input
                type="checkbox"
                :checked="company.is_public_partner === 1"
                :disabled="updatingStatusIds.includes(company.id)"
                @change="handleTogglePublicPartner(company)"
                class="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </td>

            <td class="px-4 py-3 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-2">
                
                <button
                  @click="openDetails(company)"
                  class="text-xs px-3 py-1 rounded border bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 transition cursor-pointer"
                >
                  {{ t('admin.companyManagement.actions.details') }}
                </button>

                <button
                  v-if="company.status === 'active'"
                  @click="handleDeactivateCompany(company.id)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-400 border-yellow-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {{ t('admin.companyManagement.actions.deactivate') }}
                </button>

                <template v-if="company.status === 'pending'">
                  <button
                    @click="handleApproveCompany(company.id)"
                    :disabled="loading"
                    class="text-xs px-3 py-1 rounded border bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 border-emerald-800 transition disabled:opacity-50 cursor-pointer"
                  >
                    {{ t('admin.companyManagement.actions.approve') }}
                  </button>
                  <button
                    @click="handleRejectCompany(company.id)"
                    :disabled="loading"
                    class="text-xs px-3 py-1 rounded border bg-orange-900/40 hover:bg-orange-900/60 text-orange-400 border-orange-800 transition disabled:opacity-50 cursor-pointer"
                  >
                    {{ t('admin.companyManagement.actions.reject') }}
                  </button>
                </template>

                <button
                  v-if="company.status === 'inactive'"
                  @click="handleActivateCompany(company.id)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-green-900/40 hover:bg-green-900/60 text-green-400 border-green-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {{ t('admin.companyManagement.actions.activate') }}
                </button>

                <button
                  v-if="isSuperAdmin"
                  @click="handleDeleteCompany(company.id)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-red-900/40 hover:bg-red-900/60 text-red-400 border-red-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {{ t('admin.companyManagement.actions.delete') }}
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="companies.length === 0">
            <td colspan="5" class="px-4 py-10 text-center text-slate-500 italic text-sm">
              {{ t('admin.companyManagement.noCompaniesFound') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :loading="loading"
        @change="(p) => { currentPage = p; loadCompanies() }"
        class="mt-6"
    />

    <div v-if="showDetailsModal && selectedCompany" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-white">
        <h3 class="text-xl font-bold mb-1">{{ t('admin.companyManagement.modal.detailsTitle') }}</h3>
        <p class="text-slate-500 text-xs mb-6 font-mono">ID: {{ selectedCompany.id }}</p>

        <div class="space-y-4">
          <div>
            <span class="block text-xs font-mono uppercase text-slate-500 mb-1">
              {{ t('admin.companyManagement.modal.nameLabel') }}
            </span>
            <div class="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm">
              {{ selectedCompany.name }}
            </div>
          </div>

          <div>
            <span class="block text-xs font-mono uppercase text-slate-500 mb-1">
              {{ t('admin.companyManagement.modal.websiteLabel') }}
            </span>
            <div class="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-blue-400 font-mono">
              <a v-if="selectedCompany.website" :href="selectedCompany.website" target="_blank" class="hover:underline">
                {{ selectedCompany.website }}
              </a>
              <span v-else class="text-slate-600">—</span>
            </div>
          </div>

          <div>
            <span class="block text-xs font-mono uppercase text-slate-500 mb-1">
              {{ t('admin.companyManagement.modal.regNumberLabel') }}
            </span>
            <div class="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm font-mono">
              {{ selectedCompany.registration_number || '—' }}
            </div>
          </div>

          <div>
            <span class="block text-xs font-mono uppercase text-slate-500 mb-1">
              {{ t('admin.companyManagement.tableHeaders.publicPartner') }}
            </span>
            <div class="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm">
              <input
                id="modalPublicPartner"
                type="checkbox"
                :checked="selectedCompany.is_public_partner === 1"
                :disabled="updatingStatusIds.includes(selectedCompany.id)"
                @change="handleTogglePublicPartner(selectedCompany)"
                class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-600 cursor-pointer disabled:opacity-40"
              />
              <label for="modalPublicPartner" class="text-slate-300 text-xs select-none cursor-pointer">
                {{ selectedCompany.is_public_partner === 1 ? 'Так (1)' : 'Ні (0)' }}
              </label>
            </div>
          </div>

          <div>
            <span class="block text-xs font-mono uppercase text-slate-500 mb-1">
              {{ t('admin.companyManagement.modal.statusLabel') }}
            </span>
            <div class="inline-block text-xs px-2 py-1 rounded border font-mono uppercase"
              :class="[
                selectedCompany.status === 'active' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800' : '',
                selectedCompany.status === 'pending' ? 'bg-yellow-900/40 text-yellow-400 border-yellow-800' : '',
                selectedCompany.status === 'inactive' ? 'bg-rose-900/40 text-rose-400 border-rose-800' : '',
              ]"
            >
              {{ t(`admin.companyManagement.status.${selectedCompany.status}`) }}
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button 
            @click="showDetailsModal = false; selectedCompany = null"
            type="button"
            class="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            {{ t('admin.companyManagement.modal.close') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>