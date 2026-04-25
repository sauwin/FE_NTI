<template>
  <h1 class="font-bold text-4xl text-center p-4">Register</h1>
  <div class="flex justify-center">
    <form class="flex flex-col gap-2 mt-5">
      <div class="flex gap-4">
        <div>
          <label for="name" class="block text-blue-800">Name</label>
          <input name="name" id="name" type="text" class="border border-black w-48 h-8">
        </div>

        <div>
          <label for="surname" class="block text-blue-800">Surname</label> 
          <input name="surname" id="surname" type="text" class="border border-black w-48 h-8">
        </div>
      </div>

      <div>
        <label for="email" class="block text-blue-800">Email</label> 
        <input name="email" id="email" type="email" class="border border-black w-100 h-8">
      </div>

      <div>
        <label for="password" class="block text-blue-800">Password</label> 
        <input name="password" id="password" type="password" class="border border-black w-100 h-8">
      </div>

      <div>
        <label for="confirm" class="block text-blue-800">Confirm password</label> 
        <input name="confirm" id="confirm" type="password" class="border border-black w-100 h-8">
      </div>

      <div>
        <label for="confirm" class="block text-blue-800">Type of account</label>
        <select name="type" id="type" class="border border-black w-100 h-8">
          <option value="student">Student</option>
          <option value="company">Company</option>
          <option value="mentor">Mentor</option>
          <option value="internal">Internal role</option>
        </select>
      </div>

      <div class="mt-2">
        I read and agree to Terms and conditions <input type="checkbox" class="pt-8 align-middle">
      </div>

      <input type="submit" class="bg-blue-700 text-white w-100 h-10 mt-4">
      
      <div class = "text-center mt-4">
        Already have an account? <router-link class="text-blue-600 hover:text-blue-900" to="/login">Log in</router-link>
      </div>
    </form>
  </div>
</template>