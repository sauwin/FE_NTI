<template>
  <div class="flex flex-col items-center mt-20 gap-4">
    <h1 class="text-3xl font-bold text-green-600">Email verified!</h1>
    <p class="text-gray-400">Your account is active. Please complete your profile.</p>
    <router-link to="/profile/complete" class="bg-blue-700 text-white px-6 py-2 rounded">
      Complete Profile
    </router-link>
  </div>
</template>
