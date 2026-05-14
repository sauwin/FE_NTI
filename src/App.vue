<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { setConfirmDialogRef } from './composables/useConfirm'
import ConfirmDialog from './components/ConfirmDialog.vue'
import api from './api/axios'

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
