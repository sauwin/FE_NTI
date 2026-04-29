<template>
  <nav class="w-screen h-12 flex justify-between px-4 fixed bg-slate-800">
    <div class="font-medium text-2xl flex gap-1 items-center">
      <img src="/logo.png" class="h-8 w-8">
      NTI
    </div>
    <div class="flex gap-4 items-center px-8 mt-1">
      <router-link class="hover:text-blue-300" to="/">Home</router-link>
      <router-link class="hover:text-blue-300" to="/programs/a">Program A</router-link>
      <router-link class="hover:text-blue-300" to="/programs/b">Program B</router-link>
      <router-link class="hover:text-blue-300" to="/auth/login">Login</router-link>
      <router-link class="hover:text-blue-300" to="/about">About</router-link>
      <router-link class="hover:text-blue-300" to="/faq">FAQ</router-link>
      <router-link class="hover:text-blue-300" to="/dashboard">Dashboard</router-link>
    </div>
  </nav>
</template>