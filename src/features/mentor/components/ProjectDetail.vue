<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getMentorshipById, createConsultation, updateConsultation, deleteConsultation } from '../api/mentorships'
import type { Mentorship, Consultation } from '../types/mentorships'
import { useConfirm } from "@/shared/composables/useConfirm.ts"

const props = defineProps<{
  mentorship: Mentorship
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const { t, locale } = useI18n()

// Core journal datasets
const consultations = ref<Consultation[]>([])
const loadingDetail = ref(false)

// Dialog & Form configuration states
const showLogForm = ref(false)
const editingConsultationId = ref<number | null>(null)

// Form reactive fields
const formDate = ref(new Date().toISOString().substr(0, 10))
const formDuration = ref(60)
const formSummary = ref('')
const formSubmitting = ref(false)
const formSuccess = ref('')

/**
 * Fetch consultation records
 */
const fetchConsultations = async () => {
  loadingDetail.value = true
  formSuccess.value = ''
  try {
    const res = await getMentorshipById(props.mentorship.id)
    consultations.value = res.data.consultations || []
  } catch (err) {
    console.error('Error while loading consultation details:', err)
  } finally {
    loadingDetail.value = false
  }
}

/**
 * Store a newly planned or past consultation
 */
const submitConsultation = async () => {
  formSubmitting.value = true
  formSuccess.value = ''
  try {
    const result = await createConsultation(props.mentorship.id, {
      date: formDate.value,
      duration_minutes: formDuration.value,
      summary: formSummary.value || null,
    })
    
    consultations.value.unshift(result.data.data)
    resetForm()
    showLogForm.value = false
    formSuccess.value = t('mentor.success.consultationScheduled')
  } catch (err: any) {
    await useConfirm({
      title: t('mentor.confirm.errorTitle'),
      message: err.response?.data?.message || t('mentor.errors.consultationSaveFailed'),
      confirmText: t('mentor.confirm.okayBtn'),
      danger: false,
    })
  } finally {
    formSubmitting.value = false
  }
}

/**
 * Open inline editing mode for a specific consultation
 */
const startEditConsultation = (c: Consultation) => {
  editingConsultationId.value = c.id
  formDate.value = c.date
  formDuration.value = c.duration_minutes
  formSummary.value = c.summary || ''
}

/**
 * Save updated consultation or add post-meeting summary via PATCH API
 */
const saveConsultationUpdate = async (id: number) => {
  formSubmitting.value = true
  try {
    await updateConsultation(props.mentorship.id, id, {
      date: formDate.value,
      duration_minutes: formDuration.value,
      summary: formSummary.value || null,
    })
    
    const target = consultations.value.find(c => c.id === id)
    if (target) {
      target.date = formDate.value
      target.duration_minutes = formDuration.value
      target.summary = formSummary.value || null
    }
    editingConsultationId.value = null
    resetForm()
    formSuccess.value = t('mentor.success.consultationUpdated')
  } catch (err: any) {
    await useConfirm({
      title: t('mentor.confirm.errorTitle'),
      message: err.response?.data?.message || t('mentor.errors.consultationUpdateFailed'),
      confirmText: t('mentor.confirm.okayBtn'),
      danger: false,
    })
  } finally {
    formSubmitting.value = false
  }
}

/**
 * Handle destruction of a consultation record
 */
const handleDestroyConsultation = async (consultationId: number) => {
  const confirmed = await useConfirm({
    title: t('mentor.confirm.deleteTitle'),
    message: t('mentor.confirm.deleteMessage'),
    confirmText: t('mentor.confirm.deleteBtn'),
    cancelText: t('mentor.confirm.cancelBtn'),
    danger: true,
  })
  if (!confirmed) {
    return
  }
  
  try {
    await deleteConsultation(props.mentorship.id, consultationId)
    consultations.value = consultations.value.filter(c => c.id !== consultationId)
    formSuccess.value = t('mentor.success.consultationDeleted')
    if (editingConsultationId.value === consultationId) {
      resetForm()
    }
  } catch (err: any) {
    await useConfirm({
      title: t('mentor.confirm.errorTitle'),
      message: err.response?.data?.message || t('mentor.errors.consultationDeleteFailed'),
      confirmText: t('mentor.confirm.okayBtn'),
      danger: false,
    })
  }
}

const resetForm = () => {
  formDate.value = new Date().toISOString().substr(0, 10)
  formDuration.value = 60
  formSummary.value = ''
  editingConsultationId.value = null
}

const isPastDate = (dateString: string) => {
  const today = new Date().toISOString().substr(0, 10)
  return dateString < today
}

watch(() => props.mentorship.id, () => {
  fetchConsultations()
}, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between border-b border-slate-900 pb-4">
      <button @click="emit('back')" class="text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-white flex items-center gap-1 transition">
        &larr; {{ t('mentor.detail.back') }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div class="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-5 h-fit">
        <div>
          <h3 class="text-xl font-bold text-white">{{ mentorship.application?.team?.name || t('mentor.detail.individualApplicant') }}</h3>
          <p class="text-xs font-mono text-slate-500 mt-1.5">
            {{ t('mentor.detail.assigned', { date: new Date(mentorship.assigned_at).toLocaleDateString(locale === 'sk' ? 'sk-SK' : 'en-US') }) }}
          </p>
        </div>
        
        <div class="border-t border-slate-950 pt-4 space-y-4">
          <div>
            <span class="text-[10px] text-slate-500 font-mono block uppercase tracking-wider mb-1">{{ t('mentor.detail.program') }}</span>
            <span class="text-sm text-slate-300 font-medium font-mono uppercase tracking-wide">
              {{ mentorship.application?.program_type ? t('mentor.table.programLabel', { type: mentorship.application.program_type.toUpperCase() }) : t('mentor.table.na') }}
            </span>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 font-mono block uppercase tracking-wider mb-1">{{ t('mentor.detail.category') }}</span>
            <span class="text-sm text-blue-400 font-medium font-mono">
              {{ (mentorship.application as any)?.category || t('mentor.detail.generalTrack') }}
            </span>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 font-mono block uppercase tracking-wider mb-1">{{ t('mentor.detail.status') }}</span>
            <span class="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/30 border border-amber-900/40 px-2.5 py-0.5 rounded-xl">
              {{ mentorship.application?.status?.replace(/_/g, ' ') }}
            </span>
          </div>
        </div>

        <div class="border-t border-slate-950 pt-4">
          <router-link 
            :to="`/applications/${mentorship.application?.id}`"
            class="w-full text-center block bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-medium px-4 py-2.5 rounded-xl transition"
          >
            {{ t('mentor.detail.viewFullProfile') }}
          </router-link>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div class="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h4 class="text-lg font-bold text-white">{{ t('mentor.detail.journalTitle') }}</h4>
            
            <button 
              v-if="mentorship.application?.status !== 'onboarding' && !editingConsultationId"
              @click="showLogForm = !showLogForm; resetForm()"
              class="text-xs font-medium px-4 py-2 rounded-xl transition shrink-0"
              :class="showLogForm 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-900/20'"
            >
              {{ showLogForm ? t('mentor.detail.btnCancel') : t('mentor.detail.btnSchedule') }}
            </button>
          </div>

          <div v-if="mentorship.application?.status === 'onboarding'" class="p-5 bg-slate-950/60 rounded-2xl border border-slate-800/60 text-center text-slate-500 text-sm italic">
            {{ t('mentor.detail.onboardingNotice') }}
          </div>

          <template v-else>
            <div v-if="formSuccess" class="p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-sm rounded-xl">
              {{ formSuccess }}
            </div>

            <form v-if="showLogForm || editingConsultationId" @submit.prevent="editingConsultationId ? saveConsultationUpdate(editingConsultationId) : submitConsultation()" class="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <p class="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400">
                {{ editingConsultationId ? t('mentor.detail.formUpdateTitle') : t('mentor.detail.formCreateTitle') }}
              </p>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">{{ t('mentor.detail.lblDate') }}</label>
                  <input v-model="formDate" type="date" required class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-slate-700 transition" />
                </div>
                <div>
                  <label class="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">{{ t('mentor.detail.lblDuration') }}</label>
                  <input v-model.number="formDuration" type="number" required min="5" max="480" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-slate-700 transition" />
                </div>
              </div>
              
              <div>
                <label class="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">
                  {{ t('mentor.detail.lblSummary') }}
                  <span v-if="!isPastDate(formDate) && !editingConsultationId" class="text-[10px] text-slate-600 lowercase font-sans"> {{ t('mentor.detail.lblOptional') }}</span>
                </label>
                <textarea 
                  v-model="formSummary" 
                  :required="isPastDate(formDate)"
                  :placeholder="t('mentor.detail.placeholderSummary')" 
                  rows="4" 
                  class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-slate-700 transition placeholder-slate-600 leading-relaxed"
                ></textarea>
              </div>

              <div class="flex justify-end items-center gap-3 pt-1">
                <button 
                  v-if="editingConsultationId" 
                  type="button" 
                  @click="resetForm()" 
                  class="text-xs text-slate-400 hover:text-white font-medium transition px-2 py-2"
                >
                  {{ t('mentor.detail.btnCancel') }}
                </button>
                <button 
                  :disabled="formSubmitting" 
                  type="submit" 
                  class="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white px-4 py-2 rounded-lg text-xs font-medium transition shadow-sm shadow-blue-900/20"
                >
                  {{ formSubmitting ? t('mentor.detail.btnProcessing') : (editingConsultationId ? t('mentor.detail.btnUpdateRecord') : t('mentor.detail.btnSchedule')) }}
                </button>
              </div>
            </form>

            <div v-if="loadingDetail" class="text-slate-500 text-sm font-mono">{{ t('mentor.detail.loadingHistory') }}</div>
            <div v-else-if="consultations.length === 0" class="text-sm text-slate-500 italic py-4">
              {{ t('mentor.detail.noConsultations') }}
            </div>
            
            <div v-else class="space-y-4">
              <div 
                v-for="c in consultations" 
                :key="c.id" 
                class="p-5 rounded-2xl border space-y-3.5 transition"
                :class="editingConsultationId === c.id ? 'border-blue-500 bg-slate-900/30' : 'border-slate-800/60 bg-slate-950/40'"
              >
                <div class="flex justify-between items-center border-b border-slate-950 pb-3">
                  <div class="flex items-center gap-2.5">
                    <span class="text-xs font-mono font-medium text-slate-300">
                      {{ new Date(c.date).toLocaleDateString(locale === 'sk' ? 'sk-SK' : 'en-US') }}
                    </span>
                    <span 
                      class="text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-xl border"
                      :class="isPastDate(c.date) 
                        ? 'bg-slate-900 text-slate-500 border-slate-800/40' 
                        : 'bg-blue-600/15 text-blue-400 border-blue-900/40'"
                    >
                      {{ isPastDate(c.date) ? t('mentor.detail.tagOccurred') : t('mentor.detail.tagUpcoming') }}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    <span class="text-[11px] font-mono bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-800/60 text-slate-400">
                      {{ t('mentor.detail.minutesUnit', { count: c.duration_minutes }) }}
                    </span>
                    
                    <button 
                      v-if="editingConsultationId !== c.id"
                      @click="startEditConsultation(c)" 
                      class="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition"
                    >
                      {{ t('mentor.detail.btnEditReview') }}
                    </button>

                    <button 
                      @click="handleDestroyConsultation(c.id)" 
                      class="text-[11px] text-red-400 hover:text-red-300 font-medium transition"
                      :title="t('mentor.detail.btnDeleteTitle')"
                    >
                      {{ t('mentor.detail.btnDelete') }}
                    </button>
                  </div>
                </div>

                <div v-if="c.summary" class="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                  {{ c.summary }}
                </div>
                <div v-else-if="isPastDate(c.date)" class="p-4 bg-amber-950/20 border border-amber-900/30 text-amber-400 text-xs rounded-xl italic flex justify-between items-center">
                  <span>{{ t('mentor.detail.passedNotice') }}</span>
                </div>
                <div v-else class="text-slate-500 text-xs italic">
                  {{ t('mentor.detail.upcomingNotice') }}
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

    </div>
  </div>
</template>