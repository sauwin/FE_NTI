<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  show: boolean
  notification: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t, locale } = useI18n()

const parsedContext = computed(() => {
  if (!props.notification?.context) return null
  try {
    return typeof props.notification.context === 'string'
      ? JSON.parse(props.notification.context)
      : props.notification.context
  } catch {
    return null
  }
})

const subject = computed(() => {
  return parsedContext.value?.subject || t('notifications.default_subject')
})

const fullMessage = computed(() => {
  return parsedContext.value?.message || props.notification?.message || t('notifications.default_message')
})

const eventType = computed(() => {
  return parsedContext.value?.event_type || 'system_alert'
})

const formatNotificationDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString(locale.value === 'sk' ? 'sk-SK' : 'en-GB')
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" @click="emit('close')">
      
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        enter-to-class="opacity-100 translate-y-0 sm:scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 sm:scale-100"
        leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      >
        <div 
          class="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          @click.stop
        >
          <div class="px-6 py-4 border-b border-slate-800/80 bg-slate-950/20 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-900/30">
                {{ eventType.replace(/_/g, ' ') }}
              </span>
              <span class="text-xs font-mono text-slate-500">
                {{ notification ? formatNotificationDate(notification.created_at) : '' }}
              </span>
            </div>
            
            <button 
              @click="emit('close')" 
              class="text-slate-500 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-4 custom-scrollbar">
            <div>
              <h3 class="text-lg font-bold text-white leading-snug">
                {{ subject }}
              </h3>
              <p class="text-xs font-mono text-slate-500 mt-1">
                {{ t('notifications.recipient_prefix') }} {{ notification?.recipient_email || t('notifications.fallback_recipient') }}
              </p>
            </div>

            <div class="border-t border-slate-800/60 my-2"></div>

            <div class="text-slate-300 text-sm whitespace-pre-line leading-relaxed font-sans bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
              {{ fullMessage }}
            </div>
          </div>

          <div class="px-6 py-3.5 border-t border-slate-800/60 bg-slate-950/10 flex justify-end">
            <button 
              @click="emit('close')" 
              class="bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs font-medium px-4 py-2 rounded-xl transition"
            >
              {{ t('notifications.btn_close') }}
            </button>
          </div>

        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
</style>