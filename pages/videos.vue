<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Videos</h1>

    <div v-if="pending" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500">Error loading videos.</div>
    
    <div v-else class="bg-white p-6 rounded-lg shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published At</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th scope="col" class="relative px-6 py-3">
              <span class="sr-only">Download</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="video in videos" :key="video.video_id">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ video.title }}</div>
                <div class="text-sm text-gray-500">{{ video.video_id }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ video.channel_name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ new Date(video.published_at).toLocaleDateString() }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="video.type === 'short' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'">
                    {{ video.type }}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="downloadVideo(video.video_id)" class="text-indigo-600 hover:text-indigo-900">Download</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>
<script setup lang="ts">
const { data: videos, pending, error, refresh } = await useFetch('/api/videos');

async function downloadVideo(videoId: string) {
  try {
    await $fetch('/api/downloads', {
      method: 'POST',
      body: { videoId },
    });
    alert('Download started!');
  } catch (err) {
    alert('Error starting download.');
    console.error(err);
  }
}
</script>
