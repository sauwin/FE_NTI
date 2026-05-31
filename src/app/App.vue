<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth'
import { setConfirmDialogRef } from '@/shared/composables/useConfirm'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
import Loader from '@/shared/components/Loader.vue'

const auth = useAuthStore()
const confirmDialogRef = ref()

onMounted(async () => {
  setConfirmDialogRef(confirmDialogRef)
  await auth.restoreSession()
})
</script>

<template>
  <ConfirmDialog ref="confirmDialogRef" />

  <Loader v-if="!auth.authReady" />
  <router-view />
</template>

<style scoped></style>
