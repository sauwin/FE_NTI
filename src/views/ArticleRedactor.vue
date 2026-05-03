<template>
  <h1 class="font-bold text-4xl text-center p-4">Article Redactor</h1>
  <div class="flex justify-center">
    <form class="flex flex-col gap-2 mt-5">
      <!-- <p v-if="error" class="text-red-500 text-sm">{{ error }}</p> -->
      <div>
        <label for="title" class="block text-white">Title</label>
        <input type="text" name="title" id="title" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
      </div>
      <div>
        <label for="excerpt" class="block text-white">Excerpt</label>
        <input type="text" name="excerpt" id="excerpt" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-9" />
      </div>
      <div>
        <label for="image" class="block text-white">Image</label>
        <input type="file" name="image" id="image" accept=".jpg,.jpeg,.png,.webp" class="bg-blue-600/10 border border-blue-900 rounded-md text-gray-400 mt-1 w-100 h-9" />
      </div>
      <div>
        <label for="text" class="block text-white">Text</label>
        <textarea name="text" id="text" class="bg-blue-600/10 border border-blue-900 rounded-md mt-1 w-100 h-27"></textarea>
      </div>
      <input type="submit" class="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white w-100 h-10 mt-4">
    </form>
  </div>
</template>