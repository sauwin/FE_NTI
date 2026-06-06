<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  blockUser as blockUserApi,
  unblockUser as unblockUserApi,
  deleteAdminUser,
  removeUserRole,
  addUserRole,
  exportUsers as exportUsersApi,
  getAdminUsers,
} from '@/features/admin/api/admin'
import type { AdminRole } from '@/features/admin/types/admin'
import { useConfirm } from '@/shared/composables/useConfirm'
import Pagination from '@/shared/components/Pagination.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{ isSuperAdmin?: boolean }>()
const emit = defineEmits(['refresh'])

// Roles nti_admin can update
const AVAILABLE_ROLES = ['student', 'company', 'mentor']
// Roles super_admin can update
const SUPER_ADMIN_ROLES = ['student', 'company', 'mentor', 'evaluator', 'content_editor', 'nti_admin']
const filterRoles = ['student', 'company', 'mentor', 'evaluator', 'content_editor', 'nti_admin', 'super_admin']

const roleInOrgOptions = [
  { value: 'owner', label: t('admin.userManagementPanel.rolesInOrg.owner') },
  { value: 'contact', label: t('admin.userManagementPanel.rolesInOrg.contact') },
  { value: 'evaluator', label: t('admin.userManagementPanel.rolesInOrg.evaluator') },
  { value: 'mentor', label: t('admin.userManagementPanel.rolesInOrg.mentor') },
]

const users = ref<any[]>([])
const loading = ref(false)
const message = ref('')
const success = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const searchQuery = ref('')
const selectedRole = ref('')
const selectedStatus = ref('')

const showCompanyModal = ref(false)
const companyForm = ref({
  userId: null as number | null,
  roleSlug: '',
  registration_number: '',
  role_in_org: 'contact',
})

async function loadUsers() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value }
    if (searchQuery.value) params.search = searchQuery.value
    if (selectedRole.value) params.role = selectedRole.value
    if (selectedStatus.value) params.status = selectedStatus.value
    const res = await getAdminUsers(params)
    if (res.data?.data) {
      users.value = res.data.data
      currentPage.value = res.data.current_page
      totalPages.value = res.data.last_page
      totalItems.value = res.data.total
    } else {
      users.value = Array.isArray(res.data) ? res.data : []
      totalPages.value = 1
      totalItems.value = users.value.length
    }
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.userManagementPanel.messages.loadFailed'))
  } finally {
    loading.value = false
  }
}

function handleFilterChange() {
  currentPage.value = 1
  loadUsers()
}

function setMessage(ok: boolean, text: string) {
  success.value = ok
  message.value = text
  setTimeout(() => { message.value = '' }, 3000)
}

function canManage(user: any) {
  const adminOnlyRoles = ['super_admin']
  return !user.roles?.some((r: AdminRole) => adminOnlyRoles.includes(r.slug))
}

function getAvailableRolesToAssign(isSuperAdmin?: boolean) {
  return isSuperAdmin ? SUPER_ADMIN_ROLES : AVAILABLE_ROLES
}

function onRoleSelect(userId: number, roleSlug: string) {
  if (!roleSlug) return
  if (roleSlug === 'company') {
    companyForm.value = { userId, roleSlug, registration_number: '', role_in_org: 'contact' }
    showCompanyModal.value = true
  } else {
    assignRole(userId, roleSlug)
  }
}

async function blockUser(userId: number) {
  if (!await useConfirm({ 
    title: t('admin.userManagementPanel.confirm.blockTitle'), 
    message: t('admin.userManagementPanel.confirm.blockMessage'), 
    confirmText: t('admin.userManagementPanel.actions.block'), 
    cancelText: t('admin.userManagementPanel.modal.cancel'), 
    danger: true 
  })) return
  
  loading.value = true
  try {
    await blockUserApi(userId)
    setMessage(true, t('admin.userManagementPanel.messages.userBlocked'))
    emit('refresh')
    loadUsers()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.userManagementPanel.messages.blockFailed'))
  } finally { loading.value = false }
}

async function unblockUser(userId: number) {
  if (!await useConfirm({ 
    title: t('admin.userManagementPanel.confirm.unblockTitle'), 
    message: t('admin.userManagementPanel.confirm.unblockMessage'), 
    confirmText: t('admin.userManagementPanel.actions.unblock'), 
    cancelText: t('admin.userManagementPanel.modal.cancel'), 
    danger: false 
  })) return
  
  loading.value = true
  try {
    await unblockUserApi(userId)
    setMessage(true, t('admin.userManagementPanel.messages.userUnblocked'))
    emit('refresh')
    loadUsers()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.userManagementPanel.messages.unblockFailed'))
  } finally { loading.value = false }
}

async function deleteUser(userId: number) {
  if (!await useConfirm({ 
    title: t('admin.userManagementPanel.confirm.deleteTitle'), 
    message: t('admin.userManagementPanel.confirm.deleteMessage'), 
    confirmText: t('admin.userManagementPanel.actions.delete'), 
    cancelText: t('admin.userManagementPanel.modal.cancel'), 
    danger: true 
  })) return
  
  loading.value = true
  try {
    await deleteAdminUser(userId)
    setMessage(true, t('admin.userManagementPanel.messages.userDeleted'))
    emit('refresh')
    loadUsers()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.userManagementPanel.messages.deleteFailed'))
  } finally { loading.value = false }
}

async function removeRole(userId: number, roleSlug: string) {
  if (!await useConfirm({ 
    title: t('admin.userManagementPanel.confirm.removeRoleTitle'), 
    message: t('admin.userManagementPanel.confirm.removeRoleMessage', { role: roleSlug }), 
    confirmText: t('admin.userManagementPanel.actions.delete'), 
    cancelText: t('admin.userManagementPanel.modal.cancel'), 
    danger: true 
  })) return
  
  loading.value = true
  try {
    await removeUserRole(userId, roleSlug)
    setMessage(true, t('admin.userManagementPanel.messages.roleRemoved'))
    emit('refresh')
    loadUsers()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.userManagementPanel.messages.removeFailed'))
  } finally { loading.value = false }
}

async function assignRole(userId: number, roleSlug: string, extraData?: { registration_number: string; role_in_org: string }) {
  loading.value = true
  try {
    const user = users.value.find(u => u.id === userId)
    const currentRoles = user?.roles?.map((r: any) => r.slug) || []
    const replaceableRoles = SUPER_ADMIN_ROLES
    const rolesToRemove = currentRoles.filter((r: string) => replaceableRoles.includes(r))
    for (const role of rolesToRemove) await removeUserRole(userId, role)
    await addUserRole(userId, { role: roleSlug, ...extraData })
    setMessage(true, t('admin.userManagementPanel.messages.roleAssigned', { role: roleSlug }))
    emit('refresh')
    loadUsers()
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.userManagementPanel.messages.assignFailed'))
  } finally {
    loading.value = false
  }
}

async function confirmCompanyRole() {
  if (!companyForm.value.registration_number) { 
    setMessage(false, t('admin.userManagementPanel.messages.regNumberRequired'))
    return 
  }
  await assignRole(companyForm.value.userId!, companyForm.value.roleSlug, {
    registration_number: companyForm.value.registration_number,
    role_in_org: companyForm.value.role_in_org,
  })
  showCompanyModal.value = false
}

async function exportUsers(format: 'csv' | 'xlsx' = 'csv') {
  loading.value = true
  try {
    const response = await exportUsersApi({
      search: searchQuery.value || undefined,
      role: selectedRole.value || undefined,
      status: selectedStatus.value || undefined,
      format,
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setMessage(true, t('admin.userManagementPanel.messages.exportSuccess', { format: format.toUpperCase() }))
  } catch (e: any) {
    setMessage(false, e.response?.data?.message || t('admin.userManagementPanel.messages.exportFailed', { format: format.toUpperCase() }))
  } finally { loading.value = false }
}

let timeout: number

watch(searchQuery, () => {
  clearTimeout(timeout)

  timeout = window.setTimeout(() => {
    currentPage.value = 1
    handleFilterChange()
  }, 500)
})

watch([selectedRole, selectedStatus], () => {
  currentPage.value = 1
  handleFilterChange()
})

onMounted(loadUsers)
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
          <h3 class="text-xl font-bold text-white">{{ t('admin.userManagementPanel.title') }}</h3>
          <p class="text-sm text-slate-500 mt-1">
            {{ t('admin.userManagementPanel.description') }}
          </p>
        </div>

        <div class="flex-shrink-0 gap-2 flex">
          <button
            @click="exportUsers('csv')"
            :disabled="loading"
            class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono"
          >
            {{ t('admin.userManagementPanel.exportCsv') }}
          </button>

          <button
            @click="exportUsers('xlsx')"
            :disabled="loading"
            class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono"
          >
            {{ t('admin.userManagementPanel.exportXlsx') }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center w-full">
        <div class="sm:col-span-1">
          <input
            v-model="searchQuery"
            :placeholder="t('admin.userManagementPanel.searchPlaceholder')"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all"
          />
        </div>

        <div>
          <select
            v-model="selectedRole"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer"
          >
            <option value="">{{ t('admin.userManagementPanel.allRoles') }}</option>
            <option
              v-for="role in filterRoles"
              :key="role"
              :value="role"
            >
              {{ role }}
            </option>
          </select>
        </div>

        <div>
          <select
            v-model="selectedStatus"
            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-600 outline-none transition-all cursor-pointer"
          >
            <option value="">{{ t('admin.userManagementPanel.allStatuses') }}</option>
            <option value="active">{{ t('admin.userManagementPanel.statusActive') }}</option>
            <option value="blocked">{{ t('admin.userManagementPanel.statusBlocked') }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-slate-500 animate-pulse py-4 font-mono text-sm">
      {{ t('admin.userManagementPanel.loadingUsers') }}
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="text-xs text-slate-400 uppercase bg-slate-900/50 font-mono">
          <tr>
            <th class="px-4 py-3 rounded-tl-lg">{{ t('admin.userManagementPanel.tableHeaders.user') }}</th>
            <th class="px-4 py-3">{{ t('admin.userManagementPanel.tableHeaders.roles') }}</th>
            <th class="px-4 py-3">{{ t('admin.userManagementPanel.tableHeaders.status') }}</th>
            <th class="px-4 py-3 rounded-tr-lg text-right">{{ t('admin.userManagementPanel.tableHeaders.actions') }}</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            class="border-b border-slate-800 hover:bg-slate-800/30 transition"
          >
            <td class="px-4 py-3">
              <div class="font-semibold text-white text-sm">
                {{ user.first_name }} {{ user.last_name }}
              </div>
              <div class="text-xs text-slate-500 font-mono mt-0.5">
                {{ user.email }}
              </div>
            </td>

            <td class="px-4 py-3">
              <div class="flex gap-1 flex-wrap items-center">
                <span
                  v-for="role in user.roles"
                  :key="role.id"
                  class="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border font-mono uppercase bg-blue-900/40 text-blue-400 border-blue-800"
                >
                  {{ role.slug=='company' ? `${role.slug} (${t(`admin.userManagementPanel.rolesInOrg.${user.role_in_org}`)})` : role.slug }}
                  <button
                    v-if="!['nti_admin', 'super_admin'].includes(role.slug) && canManage(user)"
                    @click="removeRole(user.id, role.slug)"
                    class="hover:text-red-400 transition cursor-pointer leading-none"
                  >
                    ×
                  </button>
                </span>
              </div>
            </td>

            <td class="px-4 py-3">
              <span
                :class="user.status === 'active'
                  ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800'
                  : 'bg-yellow-900/40 text-yellow-400 border-yellow-800'"
                class="text-xs px-2 py-1 rounded border font-mono uppercase whitespace-nowrap"
              >
                {{ user.status === 'active' ? t('admin.userManagementPanel.statusActive') : t('admin.userManagementPanel.statusBlocked') }}
              </span>
            </td>

            <td class="px-4 py-3 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="user.status === 'active' && canManage(user)"
                  @click="blockUser(user.id)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-400 border-yellow-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {{ t('admin.userManagementPanel.actions.block') }}
                </button>

                <button
                  v-if="user.status === 'blocked' && canManage(user)"
                  @click="unblockUser(user.id)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-green-900/40 hover:bg-green-900/60 text-green-400 border-green-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {{ t('admin.userManagementPanel.actions.unblock') }}
                </button>

                <button
                  v-if="isSuperAdmin"
                  @click="deleteUser(user.id)"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-red-900/40 hover:bg-red-900/60 text-red-400 border-red-800 transition disabled:opacity-50 cursor-pointer"
                >
                  {{ t('admin.userManagementPanel.actions.delete') }}
                </button>

                <select
                  value=""
                  @change="onRoleSelect(user.id, ($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
                  :disabled="loading"
                  class="text-xs px-3 py-1 rounded border bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 border-blue-800 cursor-pointer outline-none transition disabled:opacity-50"
                >
                  <option value="" disabled selected class="bg-slate-900 text-slate-300">
                    {{ t('admin.userManagementPanel.actions.assignRole') }}
                  </option>
                  <option
                    v-for="role in getAvailableRolesToAssign(isSuperAdmin)"
                    :key="role"
                    :value="role"
                    class="bg-slate-900 text-slate-300"
                  >
                    {{ role }}
                  </option>
                </select>
              </div>
            </td>
          </tr>

          <tr v-if="users.length === 0">
            <td colspan="4" class="px-4 py-10 text-center text-slate-500 italic text-sm">
              {{ t('admin.userManagementPanel.noUsersFound') }}
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
        @change="(p) => { currentPage = p; loadUsers() }"
        class="mt-6"
    />

    <div v-if="showCompanyModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <h3 class="text-xl font-bold text-white mb-2">{{ t('admin.userManagementPanel.modal.title') }}</h3>
        <p class="text-slate-400 text-sm mb-6">{{ t('admin.userManagementPanel.modal.description') }}</p>

        <div class="space-y-5">
          <div>
            <label class="block text-xs font-mono uppercase text-slate-500 mb-2">
              {{ t('admin.userManagementPanel.modal.regNumberLabel') }}
            </label>
            <input 
              v-model="companyForm.registration_number"
              type="text"
              :placeholder="t('admin.userManagementPanel.modal.regNumberPlaceholder')"
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-mono uppercase text-slate-500 mb-2">
              {{ t('admin.userManagementPanel.modal.roleInOrgLabel') }}
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                v-for="opt in roleInOrgOptions" 
                :key="opt.value"
                @click="companyForm.role_in_org = opt.value"
                type="button"
                :class="[
                  'px-3 py-2 text-xs font-mono uppercase border rounded-lg transition-all',
                  companyForm.role_in_org === opt.value 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-8">
          <button 
            @click="showCompanyModal = false"
            type="button"
            class="flex-1 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition"
          >
            {{ t('admin.userManagementPanel.modal.cancel') }}
          </button>
          <button 
            @click="confirmCompanyRole"
            type="button"
            :disabled="!companyForm.registration_number || loading"
            class="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-blue-900/20"
          >
            {{ loading ? t('admin.userManagementPanel.modal.processing') : t('admin.userManagementPanel.modal.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>