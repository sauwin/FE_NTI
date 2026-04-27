<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import api from '../api/axios'

  const isAuthentified = ref(false)
  const userObj = ref<User | null>(null)
  const router = useRouter()

  type User = {
    email: string;
  };

  async function fetchData() {
    try {
      const res = await api.get('/auth/me')
      userObj.value = res.data
      isAuthentified.value = true
    } catch(e: any) {
      isAuthentified.value = false
    }
  }

  async function logout() {
    if (!isAuthentified) return
    try {
      const res = await api.post('/auth/logout')
      router.push('/login')
    } catch {
      alert("Enable to log out")
    }
  }

  onMounted(() => {
    fetchData()
  })
</script>

<template>
  <h1 class="font-bold text-4xl text-center p-4">Dashboard</h1>
  <div v-if="isAuthentified" class="flex flex-col mt-5 w-full items-center">
    <div>Dashboard of user {{userObj?.email}}</div>
    <button @click="logout" class=" bg-blue-700 text-white mt-5 w-40 h-10">Log out</button>
  </div>
  <div v-else class="flex mt-5 justify-center">
    User is not logged in <br>
  </div>
</template>