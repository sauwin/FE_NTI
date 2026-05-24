<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/shared/api/axios'

interface ActiveCall {
  id: number
  name: string
}

const router = useRouter()

const step = ref(1)
const loading = ref(false)
const error = ref('')

const activeCalls = ref<ActiveCall[]>([])

const form = ref({
  call_id: null as number | null,

  title: '',
  short_description: '',

  project_goal: '',
  expected_outcome: '',

  detailed_technical_description: '',
  required_technologies: '',
  architecture_requirements: '',
  platforms: '',

  required_skills: '',

  preferred_team_size: null as number | null,
  budget: null as number | null,

  deadline: '',
})

const files = ref<Record<string, File | null>>({
  technical_doc: null,
  wireframes: null,
  specifications: null
})

const docLabels: Record<string, string> = {
  technical_doc: 'Technical Documentation (PDF)',
  wireframes: 'Wireframes / Images',
  specifications: 'PDF Specifications'
}

onMounted(async () => {
  try {
    const res = await api.get('/calls/active?program=b');
    if (res.data && typeof res.data === 'object' && res.data.id) {
      activeCalls.value = [res.data]; 
      form.value.call_id = res.data.id;
    } else {
      console.warn('No active calls found');
    }
  } catch (err: any) {
    console.error('Error:', err);
    error.value = 'Failed to load active application periods.';
  }
})


function onFileChange(key: string, event: Event) {
  const input = event.target as HTMLInputElement
  files.value[key] = input.files?.[0] ?? null
}

async function submitTask(targetStatus: 'draft' | 'published') {
  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/company/tasks', {
      ...form.value,

      status: targetStatus,

      required_technologies: form.value.required_technologies
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),

      required_skills: form.value.required_skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    })

    const taskId = response.data.id

    for (const [key, file] of Object.entries(files.value)) {
      if (!file) continue

      const formData = new FormData()

      formData.append('file', file)
      formData.append('type', key)
      formData.append('task_id', String(taskId))

      await api.post('/documents/upload', formData)
    }

    step.value = 3
  } catch (e: any) {
    error.value =
      e?.response?.data?.message ||
      'Error saving challenge.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex-center-page">
    <div class="w-full max-w-3xl">

      <div class="mb-8 text-center">
        <div
          class="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-600/10 border border-blue-900 px-4 py-1.5 rounded-full mb-4"
        >
          Program B
        </div>

        <h1 class="font-bold text-4xl text-white">
          Create Company Challenge
        </h1>

        <p class="text-gray-400 mt-2 text-sm">
          Submit a technical challenge for student teams
        </p>
      </div>

      <div class="flex items-center mb-8">

        <div class="flex-center">
          <div
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',

              step >= 1
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-blue-900 text-gray-500'
            ]"
          >
            1
          </div>

          <span
            class="text-xs mt-1.5"
            :class="step >= 1 ? 'text-blue-400' : 'text-gray-600'"
          >
            Challenge
          </span>
        </div>

        <div
          class="flex-1 h-px mx-2 mb-4"
          :class="step >= 2 ? 'bg-blue-600' : 'bg-blue-900'"
        ></div>

        <div class="flex-center">
          <div
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',

              step >= 2
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-blue-900 text-gray-500'
            ]"
          >
            2
          </div>

          <span
            class="text-xs mt-1.5"
            :class="step >= 2 ? 'text-blue-400' : 'text-gray-600'"
          >
            Documents
          </span>
        </div>

        <div
          class="flex-1 h-px mx-2 mb-4"
          :class="step >= 3 ? 'bg-blue-600' : 'bg-blue-900'"
        ></div>

        <div class="flex-center">
          <div
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border',

              step >= 3
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-blue-900 text-gray-500'
            ]"
          >
            3
          </div>

          <span
            class="text-xs mt-1.5"
            :class="step >= 3 ? 'text-blue-400' : 'text-gray-600'"
          >
            Final
          </span>
        </div>

      </div>

      <div
        v-if="step === 3"
        class="text-center py-12"
      >
        <div class="text-5xl mb-4">
          ✓
        </div>

        <h2 class="text-2xl font-bold text-white mb-2">
          Challenge Published
        </h2>

        <p class="text-gray-400 text-sm mb-6">
          Your company challenge has been successfully submitted to Program B.
          Student teams will be able to apply after review.
        </p>

        <button
          @click="router.push('/programs/b')"
          class="bg-blue-600 hover:bg-blue-700 text-white px-8 h-10 rounded-md text-sm cursor-pointer"
        >
          Go to Program B
        </button>
      </div>

      <form
        v-else-if="step === 1"
        @submit.prevent="step = 2"
        class="flex-col-gap"
      >
        <p v-if="error" class="text-error-sm">
          {{ error }}
        </p>

        <div>
          <label class="label">
            Active Call
            <span class="text-error">*</span>
          </label>

          <select
            v-model="form.call_id"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option
              v-for="c in activeCalls"
              :key="c.id"
              :value="c.id"
              class="bg-dark"
            >
              {{ c.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="label">
            Project Title
            <span class="text-error">*</span>
          </label>

          <input
            v-model="form.title"
            required
            type="text"
            placeholder="AI Recruitment Platform"
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="label">
            Short Description
            <span class="text-error">*</span>
          </label>

          <textarea
            v-model="form.short_description"
            required
            placeholder="Brief summary of the challenge..."
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full min-h-[90px] p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label class="label">
              Project Goal
            </label>

            <textarea
              v-model="form.project_goal"
              placeholder="What problem should be solved?"
              class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full min-h-[100px] p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label class="label">
              Expected Outcome
            </label>

            <textarea
              v-model="form.expected_outcome"
              placeholder="Expected deliverables..."
              class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full min-h-[100px] p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

        </div>

        <div>
          <label class="label">
            Technical Description
          </label>

          <textarea
            v-model="form.detailed_technical_description"
            placeholder="Architecture, APIs, integrations, infrastructure..."
            class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full min-h-[140px] p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label class="label">
              Required Technologies
            </label>

            <input
              v-model="form.required_technologies"
              placeholder="Laravel, Vue, Docker..."
              class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="label">
              Required Skills
            </label>

            <input
              v-model="form.required_skills"
              placeholder="Backend, DevOps..."
              class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label class="label">
              Team Size
            </label>

            <input
              v-model.number="form.preferred_team_size"
              type="number"
              placeholder="4"
              class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="label">
              Budget (€)
            </label>

            <input
              v-model.number="form.budget"
              type="number"
              placeholder="5000"
              class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label class="label">
              Deadline
            </label>

            <input
              v-model="form.deadline"
              type="date"
              class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-full h-9 px-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

        </div>

        <button
          type="submit"
          class="bg-blue-600 hover:bg-blue-700 text-white w-full h-10 mt-2 rounded-md text-sm font-medium transition cursor-pointer"
        >
          Continue to Documents →
        </button>

      </form>

      <div
        v-else
        class="flex-col-gap"
      >
        <p v-if="error" class="text-error-sm">
          {{ error }}
        </p>

        <p class="text-gray-400 text-sm">
          Upload challenge related documents and technical materials.
        </p>

        <div
          v-for="(label, key) in docLabels"
          :key="key"
        >
          <label class="label">
            {{ label }}
          </label>

          <div class="relative">

            <input
              type="file"
              class="hidden"
              :id="`file-${key}`"
              @change="onFileChange(key, $event)"
            />

            <label
              :for="`file-${key}`"
              class="flex items-center justify-between bg-blue-600/10 border border-blue-900 hover:border-blue-600 rounded-md px-3 h-10 cursor-pointer transition-colors"
              :class="{ 'border-blue-500': files[key] }"
            >
              <span
                class="text-sm truncate pr-2"
                :class="files[key] ? 'text-white' : 'text-gray-600'"
              >
                {{ files[key]?.name ?? 'Choose file...' }}
              </span>

              <span class="text-xs text-blue-400 shrink-0">
                Browse
              </span>
            </label>

          </div>
        </div>

        <div class="flex flex-wrap gap-3 mt-2">

          <button
            type="button"
            @click="step = 1"
            class="border border-blue-900 hover:border-blue-600 text-gray-400 hover:text-white w-full sm:w-1/4 h-10 rounded-md text-sm cursor-pointer transition-colors"
          >
            ← Back
          </button>

          <button
            type="button"
            @click="submitTask('draft')"
            :disabled="loading"
            class="border border-blue-600 text-blue-400 hover:bg-blue-600/10 disabled:opacity-50 cursor-pointer flex-1 h-10 rounded-md text-sm font-medium transition-colors"
          >
            {{ loading ? 'Saving...' : 'Save Draft' }}
          </button>

          <button
            type="button"
            @click="submitTask('published')"
            :disabled="loading"
            class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer text-white flex-1 h-10 rounded-md text-sm font-medium transition-colors"
          >
            {{ loading ? 'Publishing...' : 'Publish Challenge' }}
          </button>

        </div>
      </div>

    </div>
  </div>
</template>