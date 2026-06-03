<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import DocumentActionButtons from '@/shared/components/DocumentActionButtons.vue'

  import { getApplicationById, getApplicationDocuments } from '@/features/applications/api/applications'
  import { getApplicationEvaluations, finalizeEvaluation } from '@/features/admin/api/admin'

  import type { StudentApplication, ApplicationDocument } from '@/features/applications/types/applications'
  import type { Evaluation } from '@/features/evaluation/types/evaluations'

  const route = useRoute()
  const router = useRouter()

  const applicationId = Number(route.params.applicationId)

  const loading = ref(false)
  const submitting = ref(false)
  const success = ref('')
  const error = ref('')

  const app = ref<StudentApplication | null>(null)
  const docs = ref<ApplicationDocument[]>([])

  // 2. DATA MAPPING: Based on Evaluation.php, User.php & EvaluationCriteriaScore.php models
  const evaluatorsReviews = ref<Evaluation[]>([])

  // --- COMPUTED METRICS ---
  
  // Calculate weighted average for each evaluation, then get global average score
  const globalAverageScore = computed(() => {
    if (!evaluatorsReviews?.value?.length) return 0
    
    const individualAverages = evaluatorsReviews.value.map(review => {
      return review.scores.reduce((acc, curr) => {
        return acc + (Number(curr.score) * (Number(curr.weight_at_moment) / 100))
      }, 0)
    })

    const totalSum = individualAverages.reduce((acc, score) => acc + score, 0)
    return Math.round(totalSum / evaluatorsReviews.value.length)
  })

  // Admin final verdict fields 
  const finalStatus = ref<'approved' | 'rejected' | 'needs_revision'>('approved')
  const internalNotes = ref('') 

  // Submitting final decision
  async function submitFinalVerdict() {
    submitting.value = true
    error.value = ''
    success.value = ''

    try {
      submitting.value = true
      const payload = {
        status: finalStatus.value,
        comment: internalNotes.value,
      }
      
      await finalizeEvaluation(applicationId, payload)
      
      success.value = `Application status successfully synchronized to [${finalStatus.value.toUpperCase()}].`
      setTimeout(() => router.push('/dashboard'), 3000)
    } catch (e) {
      error.value = 'Failed to record the final admin decision.'
    } finally {
      submitting.value = false
    }
  }

  onMounted(async () => {
    try {
      loading.value = true
      const [appRes, docsRes, revisionRes] = await Promise.all([
        getApplicationById(applicationId),
        getApplicationDocuments(applicationId),
        getApplicationEvaluations(applicationId),
      ])

      app.value = appRes.data
      docs.value = docsRes.data
      evaluatorsReviews.value = revisionRes.data

      console.log(app.value)
    } catch (e) {
      error.value = 'Failed to load application data.'
    } finally {
      loading.value = false
    }
  })

  const isCommitteeFinished = computed(() => evaluatorsReviews.value?.length == app.value?.total_evaluators_count)
</script>

<template>
  <div class="bg-slate-950 min-h-screen text-slate-100 flex flex-col">
    <div class="border-b border-slate-800 bg-slate-900/60 px-6 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      <div class="flex items-center gap-4">
        <button @click="router.push('/dashboard')" class="text-slate-400 hover:text-white transition text-sm flex items-center gap-1.5">
          ← Admin Panel
        </button>
        <span class="text-slate-700">|</span>
        <h1 class="text-lg font-bold text-white flex items-center gap-2">
          Consolidated Verdict Panel <span class="font-mono text-blue-400">#{{ applicationId }}</span>
        </h1>
      </div>
      
      <div class="flex items-center gap-6">
        <div class="text-right hidden sm:block border-r border-slate-800 pr-6">
          <span class="text-xs text-slate-400 block">Reviews Status</span>
          <span class="text-sm font-mono font-semibold" :class="isCommitteeFinished ? 'text-blue-400' : 'text-slate-400'">
            {{ evaluatorsReviews.length }} / {{ app?.total_evaluators_count ?? '-' }} Done
          </span>
        </div>

        <div class="text-right hidden sm:block">
          <span class="text-xs text-slate-400 block">Consolidated Score</span>
          <span class="text-lg font-mono font-bold text-blue-400">{{ globalAverageScore }} / 100 b</span>
        </div>
        
        <button
          @click="submitFinalVerdict"
          :disabled="submitting || !isCommitteeFinished"
          class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition shadow-sm shadow-blue-500/20"
        >
          {{ 
            submitting ? 'Saving Verdict...' :
            isCommitteeFinished ? 'Publish Final Verdict' : 
            'Committee Reviews Incomplete' 
          }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center text-slate-400 animate-pulse">
      Loading application evaluations and metadata...
    </div>

    <div v-else class="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      
      <div class="p-6 border-b lg:border-b-0 lg:border-r border-slate-800 lg:overflow-x-hidden max-h-[calc(100vh-69px)]">
        <div class="space-y-6">
          
          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Application Specs</h2>
            <div class="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3 text-sm">
              <div class="flex justify-between"><span class="text-slate-500">Project / Team Name:</span> <span class="text-white font-medium">{{ app?.team?.name  }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Program Track:</span> <span class="text-blue-400 font-semibold uppercase">{{ 'Program ' + app?.program_type }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Stack Category:</span> <span class="text-slate-300 font-mono text-xs">{{ app?.category }}</span></div>
              <div class="flex justify-between">
                <span class="text-slate-500">Current Status:</span> 
                <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase">{{ app?.status?.replace(/_/g, ' ') }}</span>
              </div>
            </div>
          </div>

          <!-- Documents -->
          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Submitted Team Attachments</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div v-for="doc in docs" :key="doc.id" class="bg-slate-900/30 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between group">
                <div class="flex items-center gap-2 overflow-hidden">
                  <span class="text-lg">📄</span>
                  <div class="truncate">
                    <p class="text-xs text-slate-200 font-medium truncate" :title="doc.file_name">{{ doc.file_name }}</p>
                    <p class="text-[10px] text-slate-500 uppercase font-mono">{{ doc.type }}</p>
                  </div>
                </div>
                <DocumentActionButtons
                  :documentId="doc.id"
                  :fileName="doc.file_name"
                  :mimeType="doc.mime_type"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Committee Peer Evaluation Sheets</h2>
            <div class="space-y-4">
              <div v-for="review in evaluatorsReviews" :key="review.id" class="bg-slate-900/50 border border-slate-800/60 rounded-xl p-4">
                
                <div class="flex justify-between items-start border-b border-slate-800/80 pb-3 mb-3">
                  <div class="flex items-center gap-2.5">
                    <div>
                      <h4 class="text-xs font-bold text-white">{{ review.evaluator.first_name }} {{ review.evaluator.last_name }}</h4>
                      <span class="text-[9px] font-mono uppercase text-slate-500">{{ review.status }}</span>
                    </div>
                  </div>
                  
                  <span :class="[
                    'text-[10px] uppercase font-mono px-2 py-0.5 rounded border',
                    review.recommendation === 'approve' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  ]">
                    {{ review.recommendation === 'approve' ? 'Approve' : 'Revision' }}
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                  <div v-for="s in review.scores" :key="s.id" class="bg-slate-950 p-2 rounded-lg border border-slate-900 flex flex-col justify-between">
                    <div class="flex items-center justify-between gap-1">
                      <p class="text-[10px] text-slate-500 truncate" :title="s.criterion.title">{{ s.criterion.title }}</p>
                      
                      <div class="relative group/tooltip inline-block cursor-help">
                        <span class="text-[12px] text-slate-600 hover:text-blue-400 font-bold px-0.5">ⓘ</span>
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded p-2 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:pointer-events-auto transition-all duration-200 shadow-xl z-50 normal-case font-sans">
                          {{ s.comment }}
                          <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                        </div>
                      </div>
                    </div>
                    
                    <p class="text-xs font-mono font-bold text-slate-300 mt-1">
                      {{ s.score }} <span class="text-[9px] text-slate-600">b. ({{ s.weight_at_moment }}%)</span>
                    </p>
                  </div>
                </div>

                <div class="bg-slate-950/60 rounded-lg p-2.5 border border-slate-900/60">
                  <p class="text-[11px] text-slate-400 italic leading-relaxed">
                    <span class="text-blue-400 not-italic font-bold text-[10px] block mb-0.5">Reviewer Statement:</span>
                    "{{ review.comment }}"
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      <div class="p-6 lg:overflow-y-auto max-h-[calc(100vh-69px)] bg-slate-900/10 flex flex-col justify-between">
        <div>
          <p v-if="error" class="text-red-400 text-sm mb-4 bg-red-950/20 border border-red-900 p-3 rounded-xl">{{ error }}</p>
          <p v-if="success" class="text-green-400 text-sm mb-4 bg-green-950/20 border border-green-900 p-3 rounded-xl">{{ success }}</p>

          <div class="bg-gradient-to-br from-blue-950/30 to-slate-900 border border-blue-500/20 rounded-xl p-5 mb-6 text-center">
            <span class="text-xs text-blue-400 uppercase tracking-widest font-mono font-semibold block mb-1">Committee Average Index</span>
            <h3 class="text-4xl font-mono font-black text-white tracking-tight">
              {{ globalAverageScore }} <span class="text-lg text-slate-500">/ 100</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-2 max-w-sm mx-auto">
              Automatically generated mathematical arithmetic average
            </p>
          </div>

          <div class="bg-slate-900/40 border border-slate-800 p-5 rounded-xl mb-6">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Override Application System Status</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              <button 
                @click="finalStatus = 'approved'"
                :class="['px-4 py-3 rounded-xl text-xs font-bold border capitalize transition flex flex-col items-center gap-1 justify-center', 
                  finalStatus === 'approved' ? 'bg-green-500/10 border-green-500 text-green-400 shadow-md shadow-green-500/5' : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700'
                ]"
              >
                <span>🟢 Approve</span>
                <span class="text-[9px] font-normal text-slate-500">Admit into incubator</span>
              </button>

              <button 
                @click="finalStatus = 'needs_revision'"
                :class="['px-4 py-3 rounded-xl text-xs font-bold border capitalize transition flex flex-col items-center gap-1 justify-center', 
                  finalStatus === 'needs_revision' ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/5' : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700'
                ]"
              >
                <span>🟡 Revision</span>
                <span class="text-[9px] font-normal text-slate-500">Return to applicant</span>
              </button>

              <button 
                @click="finalStatus = 'rejected'"
                :class="['px-4 py-3 rounded-xl text-xs font-bold border capitalize transition flex flex-col items-center gap-1 justify-center', 
                  finalStatus === 'rejected' ? 'bg-red-500/10 border-red-500 text-red-400 shadow-md shadow-red-500/5' : 'border-slate-800 bg-slate-900/20 text-slate-400 hover:border-slate-700'
                ]"
              >
                <span>🔴 Reject</span>
                <span class="text-[9px] font-normal text-slate-500">Permanent dismissal</span>
              </button>

            </div>
          </div>

          <div class="bg-slate-900/40 border border-slate-800 p-5 rounded-xl mb-6">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Internal Notes & Official Resolution</h3>
            <p class="text-[11px] text-slate-500 mb-3">
              This text content will be persistent in the application logs database and sent out to the team if a revision request triggers.
            </p>
            <textarea 
              v-model="internalNotes" 
              rows="5" 
              placeholder="State the analytical summary or reasoning leading to this overriding status decision (e.g. alignment with program limits, fiscal review flags, contractual agreements)..." 
              class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 outline-none resize-none transition"
            />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>