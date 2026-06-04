<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useAuthStore } from '@/features/auth/stores/auth'

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '@/shared/api/notifications'

import NotificationDetailModal from '@/shared/components/NotificationDetailModal.vue'

const router = useRouter()
const auth = useAuthStore()

const unread = ref(0)
const notifications = ref<any[]>([])

const notifOpen = ref(false)
const mobileOpen = ref(false)

const showModal = ref(false)
const selectedNotif = ref<any | null>(null)


onMounted(async () => {
  if (auth.isLoggedIn) {
    try {
      const res = await getNotifications()

      unread.value = res.data.unread_count
      notifications.value = res.data.notifications
    } catch (error) {
      console.error(error)
    }
  }

  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick() {
  notifOpen.value = false
  mobileOpen.value = false
}

async function markRead(notification: any) {
  if (notification.status === 'queued') {
    await markNotificationRead(notification.id)

    notification.status = 'sent'
    unread.value = Math.max(0, unread.value - 1)
  }
}

async function markAllRead() {
  await markAllNotificationsRead()

  unread.value = 0

  notifications.value = notifications.value.map(notification => ({
    ...notification,
    status: 'sent'
  }))
}

async function openNotification(notification: any) {
  selectedNotif.value = notification

  showModal.value = true
  notifOpen.value = false
  mobileOpen.value = false

  await markRead(notification)
}

function logout() {
  auth.logout()

  mobileOpen.value = false

  router.push('/auth/login')
}

function notifMessage(notification: any): string {
  try {
    const ctx =
      typeof notification.context === 'string'
        ? JSON.parse(notification.context)
        : notification.context

    return ctx?.subject || ctx?.message || t('navbar.notificationFallback')
  } catch {
    return notification.message || t('navbar.notificationFallback')
  }
}

//Translations
const { locale, t } = useI18n()

const selectedLanguage = computed({
  get: () => locale.value,
  set: (value: string) => {
    locale.value = value
    localStorage.setItem('locale', value)
  },
})
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 h-14
    flex items-center justify-between
    px-4 sm:px-6 md:px-10
    bg-[#080f1e]/90 backdrop-blur
    border-b border-slate-800 select-none"
  >
    <!-- LOGO -->
    <router-link
      to="/"
      class="flex items-center gap-2 text-white font-bold text-xl z-50"
    >
      <img
        src="/logo.png"
        :alt="$t('navbar.logoAlt')"
        class="w-8 h-8"
      />

      <span>NTI</span>
    </router-link>

    <!-- DESKTOP NAVIGATION -->
    <div class="hidden md:flex items-center gap-6 lg:gap-8 text-sm">
      <router-link
        to="/"
        exact-active-class="text-white"
        class="text-slate-400 hover:text-white transition"
      >
        {{ $t('navbar.home') }}
      </router-link>

      <router-link
        to="/programs/a"
        active-class="text-white"
        class="text-slate-400 hover:text-white transition"
      >
        {{ $t('navbar.programA') }}
      </router-link>

      <router-link
        to="/programs/b"
        active-class="text-white"
        class="text-slate-400 hover:text-white transition"
      >
        {{ $t('navbar.programB') }}
      </router-link>

      <router-link
        to="/partners"
        active-class="text-white"
        class="text-slate-400 hover:text-white transition"
      >
        {{ $t('navbar.partners') }}
      </router-link>

      <router-link
        to="/about"
        active-class="text-white"
        class="text-slate-400 hover:text-white transition"
      >
        {{ $t('navbar.about') }}
      </router-link>

      <router-link
        to="/faq"
        active-class="text-white"
        class="text-slate-400 hover:text-white transition"
      >
        {{ $t('navbar.faq') }}
      </router-link>
    </div>

    <!-- DESKTOP ACTIONS -->
    <div class="hidden md:flex items-center gap-3">
      <template v-if="!auth.isLoggedIn">
        <router-link
          to="/auth/login"
          class="px-4 py-1.5 text-sm text-slate-400 hover:text-white transition"
        >
          {{ $t('auth.login') }}
        </router-link>

        <router-link
          to="/auth/register"
          class="px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition"
        >
          {{ $t('auth.register') }}
        </router-link>
      </template>

      <template v-else>
        <!-- NOTIFICATIONS -->
        <div
          class="relative"
          @click.stop
        >
          <button
            @click="notifOpen = !notifOpen"
            class="relative p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/50 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>

            <span
              v-if="unread > 0"
              class="absolute top-1 right-1
              flex items-center justify-center
              w-4 h-4 rounded-full
              bg-red-500 text-white text-[10px] font-bold animate-pulse"
            >
              {{ unread > 9 ? '9+' : unread }}
            </span>
          </button>

          <!-- DESKTOP NOTIFICATION DROPDOWN -->
          <div
            v-if="notifOpen"
            class="absolute right-0 mt-2 w-80
            bg-slate-900 border border-slate-800
            rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div
              class="flex items-center justify-between
              px-4 py-3 border-b border-slate-800"
            >
              <span class="text-sm font-semibold text-white">
                {{ $t('navbar.notifications') }}
              </span>

              <button
                @click.stop="markAllRead"
                class="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                {{ $t('navbar.markAllRead') }}
              </button>
            </div>

            <div class="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
              <div
                v-if="notifications.length === 0"
                class="px-4 py-6 text-center text-sm italic text-slate-500"
              >
                {{ $t('navbar.noNotifications') }}
              </div>

              <div
                v-for="notification in notifications"
                :key="notification.id"
                @click.stop="openNotification(notification)"
                :class="[
                  'px-4 py-3 text-sm cursor-pointer hover:bg-slate-800/40 transition',
                  notification.status === 'queued'
                    ? 'bg-blue-600/5'
                    : ''
                ]"
              >
                <div class="flex items-start gap-2.5">
                  <span
                    :class="[
                      'mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0',
                      notification.status === 'queued'
                        ? 'bg-blue-400'
                        : 'bg-slate-700'
                    ]"
                  />

                  <div class="flex-1 min-w-0">
                    <p
                      :class="[
                        'truncate leading-snug break-words',
                        notification.status === 'queued'
                          ? 'text-white font-medium'
                          : 'text-slate-400'
                      ]"
                    >
                      {{ notifMessage(notification) }}
                    </p>

                    <p class="mt-1 text-[10px] font-mono text-slate-500">
                      {{ new Date(notification.created_at).toLocaleDateString() }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DASHBOARD -->
        <router-link
          to="/dashboard"
          active-class="text-white"
          class="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition"
        >
          {{ auth.dashboardLabel }}
        </router-link>

        <!-- LOGOUT -->
        <button
          @click="logout"
          class="px-4 py-1.5 text-sm rounded-lg
          border border-slate-800
          text-slate-400 hover:text-red-400
          hover:border-red-900/50 transition"
        >
          {{ $t('auth.logout') }}
        </button>
      </template>

      <!-- DESKTOP LANGUAGE TOGGLE BUTTON -->
      <button 
        @click="selectedLanguage = selectedLanguage === 'en' ? 'sk' : 'en'"
        class="px-2.5 py-1 text-xs font-bold tracking-wider rounded-lg border 
               bg-[#0d1527]/60 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition uppercase"
      >
        {{ selectedLanguage }}
      </button>
    </div>

    <!-- MOBILE ACTIONS -->
    <div class="flex md:hidden items-center gap-1 z-50">
      <!-- MOBILE NOTIFICATIONS -->
      <template v-if="auth.isLoggedIn">
        <div
          class="relative"
          @click.stop
        >
          <button
            @click="notifOpen = !notifOpen; mobileOpen = false"
            class="relative p-2 text-slate-400 hover:text-white rounded-full transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>

            <span
              v-if="unread > 0"
              class="absolute top-1 right-1
              flex items-center justify-center
              w-4 h-4 rounded-full
              bg-red-500 text-white text-[10px] font-bold"
            >
              {{ unread > 9 ? '9+' : unread }}
            </span>
          </button>

          <!-- MOBILE NOTIFICATION DROPDOWN -->
          <div
            v-if="notifOpen"
            class="fixed top-16 right-4 left-4 sm:left-auto sm:w-80
            max-w-sm overflow-hidden rounded-xl
            bg-slate-900 border border-slate-800 shadow-2xl z-50"
          >
            <div
              class="flex items-center justify-between
              px-4 py-3 border-b border-slate-800"
            >
              <span class="text-sm font-semibold text-white">
                {{ $t('navbar.notifications') }}
              </span>

              <button
                @click.stop="markAllRead"
                class="text-xs text-blue-400 hover:text-blue-300"
              >
                {{ $t('navbar.markAllRead') }}
              </button>
            </div>

            <div class="max-h-60 overflow-y-auto divide-y divide-slate-800/50">
              <div
                v-if="notifications.length === 0"
                class="px-4 py-6 text-center text-sm italic text-slate-500"
              >
                {{ $t('navbar.noNotifications') }}
              </div>

              <div
                v-for="notification in notifications"
                :key="notification.id"
                @click.stop="openNotification(notification)"
                :class="[
                  'px-4 py-3 text-sm cursor-pointer hover:bg-slate-800/40 transition',
                  notification.status === 'queued'
                    ? 'bg-blue-600/5'
                    : ''
                ]"
              >
                <div class="flex items-start gap-2.5">
                  <span
                    :class="[
                      'mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0',
                      notification.status === 'queued'
                        ? 'bg-blue-400'
                        : 'bg-slate-700'
                    ]"
                  />

                  <div class="flex-1 min-w-0">
                    <p
                      :class="[
                        'truncate leading-snug break-words',
                        notification.status === 'queued'
                          ? 'text-white font-medium'
                          : 'text-slate-400'
                      ]"
                    >
                      {{ notifMessage(notification) }}
                    </p>

                    <p class="mt-1 text-[10px] font-mono text-slate-500">
                      {{ new Date(notification.created_at).toLocaleDateString() }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- MOBILE LANGUAGE TOGGLE BUTTON -->
      <button 
        @click="selectedLanguage = selectedLanguage === 'en' ? 'sk' : 'en'"
        class="mx-1 px-2.5 py-1 text-[11px] font-bold tracking-wider rounded-lg border 
               bg-[#0d1527]/60 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition uppercase"
      >
        {{ selectedLanguage }}
      </button>

      <!-- MOBILE MENU BUTTON -->
      <button
        @click.stop="mobileOpen = !mobileOpen; notifOpen = false"
        class="p-2 text-slate-400 hover:text-white rounded-full transition"
        :aria-label="$t('navbar.menu')"
      >
        <svg
          v-if="!mobileOpen"
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>

        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- MOBILE MENU -->
    <div
      v-if="mobileOpen"
      @click.stop
      class="fixed top-0 left-0 z-40
      flex flex-col gap-1
      w-full h-screen
      pt-20 pb-6 px-6
      overflow-y-auto
      bg-[#080f1e]/95 backdrop-blur-lg
      border-b border-slate-800 md:hidden"
    >
      <router-link
        to="/"
        @click="mobileOpen = false"
        class="py-3.5 text-base font-medium
        text-slate-400 hover:text-white transition
        border-b border-slate-800/60"
      >
        {{ $t('navbar.home') }}
      </router-link>

      <router-link
        to="/programs/a"
        @click="mobileOpen = false"
        class="py-3.5 text-base font-medium
        text-slate-400 hover:text-white transition
        border-b border-slate-800/60"
      >
        {{ $t('navbar.programA') }}
      </router-link>

      <router-link
        to="/programs/b"
        @click="mobileOpen = false"
        class="py-3.5 text-base font-medium
        text-slate-400 hover:text-white transition
        border-b border-slate-800/60"
      >
        {{ $t('navbar.programB') }}
      </router-link>

      <router-link
        to="/partners"
        @click="mobileOpen = false"
        class="py-3.5 text-base font-medium
        text-slate-400 hover:text-white transition
        border-b border-slate-800/60"
      >
        {{ $t('navbar.partners') }}
      </router-link>

      <router-link
        to="/about"
        @click="mobileOpen = false"
        class="py-3.5 text-base font-medium
        text-slate-400 hover:text-white transition
        border-b border-slate-800/60"
      >
        {{ $t('navbar.about') }}
      </router-link>

      <router-link
        to="/faq"
        @click="mobileOpen = false"
        class="py-3.5 text-base font-medium
        text-slate-400 hover:text-white transition
        border-b border-slate-800/60"
      >
        {{ $t('navbar.faq') }}
      </router-link>

      <!-- MOBILE AUTH -->
      <div class="pt-6 flex flex-col gap-3">
        <template v-if="!auth.isLoggedIn">
          <router-link
            to="/auth/login"
            @click="mobileOpen = false"
            class="py-3 text-sm font-medium text-center
            text-slate-300 hover:text-white transition
            border border-slate-800 rounded-xl bg-slate-900/40"
          >
            {{ $t('auth.login') }}
          </router-link>

          <router-link
            to="/auth/register"
            @click="mobileOpen = false"
            class="py-3 text-sm font-medium text-center
            text-white bg-blue-600 hover:bg-blue-500
            rounded-xl transition shadow-lg shadow-blue-600/10"
          >
            {{ $t('auth.register') }}
          </router-link>
        </template>

        <template v-else>
          <router-link
            to="/dashboard"
            @click="mobileOpen = false"
            class="py-3 text-sm font-medium text-center
            text-slate-300 hover:text-white transition
            border border-slate-800 rounded-xl bg-slate-900/40"
          >
            {{ auth.dashboardLabel }}
          </router-link>

          <button
            @click="logout"
            class="py-3 text-sm font-medium
            text-slate-400 hover:text-red-400
            border border-slate-800 hover:border-red-900/50
            rounded-xl transition"
          >
            {{ $t('auth.logout') }}
          </button>
        </template>
      </div>
    </div>
  </nav>

  <NotificationDetailModal
    :show="showModal"
    :notification="selectedNotif"
    @close="showModal = false; selectedNotif = null"
  />
</template>