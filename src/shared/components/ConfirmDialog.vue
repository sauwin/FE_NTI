<script setup lang="ts">
import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

const isOpen = ref(false)
const options = ref<ConfirmOptions>({
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  danger: false,
})
let resolveCallback: ((value: boolean) => void) | null = null

const open = (opts: ConfirmOptions): Promise<boolean> => {
  options.value = {
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    danger: false,
    ...opts,
  }
  isOpen.value = true
  return new Promise((resolve) => {
    resolveCallback = resolve
  })
}

const confirm = () => {
  if (resolveCallback) resolveCallback(true)
  isOpen.value = false
}

const cancel = () => {
  if (resolveCallback) resolveCallback(false)
  isOpen.value = false
}

defineExpose({ open })
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full shadow-2xl">
      <div class="p-6">
        <h2 class="text-lg font-bold text-white mb-2">{{ options.title }}</h2>
        <p class="text-slate-400 text-sm mb-6">{{ options.message }}</p>
      </div>
      <div class="border-t border-slate-800 flex gap-3 p-4">
        <button @click="cancel" class="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm font-medium transition">
          {{ options.cancelText }}
        </button>
        <button @click="confirm" :class="[
'flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition',
options.danger
? 'bg-red-600 hover:bg-red-500'
: 'bg-blue-600 hover:bg-blue-500'
]">
          {{ options.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>