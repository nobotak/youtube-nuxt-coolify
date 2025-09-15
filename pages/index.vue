<template>
  <div>
    <h1 class="text-3xl font-bold">Dashboard</h1>
    <p class="mt-2 text-gray-600">Welcome to your YouTube Manager dashboard.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      <!-- Total Channels -->
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center">
          <div class="bg-blue-500 text-white p-3 rounded-full">
            <span class="text-2xl">📺</span>
          </div>
          <div class="ml-4">
            <p class="text-gray-600">Total Channels</p>
            <p class="text-2xl font-bold">{{ stats.totalChannels }}</p>
          </div>
        </div>
      </div>

      <!-- Active Channels -->
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center">
          <div class="bg-green-500 text-white p-3 rounded-full">
            <span class="text-2xl">●</span>
          </div>
          <div class="ml-4">
            <p class="text-gray-600">Active Channels</p>
            <p class="text-2xl font-bold">{{ stats.activeChannels }}</p>
          </div>
        </div>
      </div>

      <!-- Total Videos -->
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center">
          <div class="bg-purple-500 text-white p-3 rounded-full">
            <span class="text-2xl">🎬</span>
          </div>
          <div class="ml-4">
            <p class="text-gray-600">Total Videos</p>
            <p class="text-2xl font-bold">{{ stats.totalVideos }}</p>
          </div>
        </div>
      </div>

      <!-- AI Analysis -->
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center">
          <div class="bg-red-500 text-white p-3 rounded-full">
            <span class="text-2xl">⚡</span>
          </div>
          <div class="ml-4">
            <p class="text-gray-600">AI Analysis</p>
            <p class="text-2xl font-bold">{{ stats.totalAI }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: channels, pending, error, refresh } = await useFetch('/api/channels');

const stats = computed(() => {
  if (!channels.value) {
    return {
      totalChannels: 0,
      activeChannels: 0,
      totalVideos: 0, // This will be implemented later
      totalAI: 0, // This will be implemented later
    };
  }

  const activeChannels = channels.value.filter((c: any) => c.is_active).length;

  return {
    totalChannels: channels.value.length,
    activeChannels,
    totalVideos: 0,
    totalAI: 0,
  };
});
</script>
