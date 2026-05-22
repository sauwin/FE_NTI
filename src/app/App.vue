<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/features/auth/stores/auth'
import { setConfirmDialogRef } from '@/shared/composables/useConfirm'
import ConfirmDialog from '@/shared/components/ConfirmDialog.vue'
import api from '@/shared/api/axios'

const auth = useAuthStore()
const confirmDialogRef = ref()

onMounted(async () => {
  setConfirmDialogRef(confirmDialogRef)

  if (auth.token) {
    try {
      const res = await api.get('/auth/me')
      auth.login(auth.token, res.data)
    } catch {
      auth.logout()
    }
  }
})
</script>

<template>
  <ConfirmDialog ref="confirmDialogRef" />
  <router-view/>
</template>

<style scoped></style>
