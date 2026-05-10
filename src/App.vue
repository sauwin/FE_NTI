<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import api from './api/axios'

const auth = useAuthStore()

onMounted(async () => {
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
    <router-view/>
</template>

<style scoped></style>
