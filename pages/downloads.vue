<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Downloads</h1>

    <div v-if="pending" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500">Error loading downloads.</div>
    
    <div v-else class="bg-white p-6 rounded-lg shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="file in downloads" :key="file.filename">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ file.filename }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ new Date(file.createdAt).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
const { data: downloads, pending, error, refresh } = await useFetch('/api/downloads');
</script>
