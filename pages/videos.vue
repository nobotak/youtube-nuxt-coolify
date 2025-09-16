<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Videos</h1>

    <div v-if="pending" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500">Error loading videos.</div>
    
    <div v-else class="bg-white p-6 rounded-lg shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published At</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Napisy</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI</th>
            <th scope="col" class="relative px-6 py-3">
              <span class="sr-only">Download</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="video in videos" :key="video.video_id">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <img :src="video.channel_thumbnail" alt="thumb" class="w-10 h-10 rounded-full"/>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      <a :href="`https://www.youtube.com/watch?v=${video.video_id}`" target="_blank" class="text-blue-600 hover:underline">{{ video.title }}</a>
                    </div>
                    <div class="text-xs text-gray-500">{{ video.video_id }}</div>
                  </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ video.channel_name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ new Date(video.published_at).toLocaleDateString() }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="video.type === 'short' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'">
                    {{ video.type }}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button @click="showCaptions(video)" class="text-gray-700 hover:text-gray-900 underline">Napisy</button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button @click="showAI(video)" class="text-gray-700 hover:text-gray-900 underline">AI</button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="downloadVideo(video.video_id)" class="text-indigo-600 hover:text-indigo-900">Download</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
  
  <!-- Modals: Captions / AI -->
  <div v-if="showCaptionsModal || showAIModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeModals">
    <div class="bg-white rounded-lg shadow p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold">{{ modalTitle }}</h3>
        <button @click="closeModals" class="text-gray-600">✕</button>
      </div>
      <div class="whitespace-pre-wrap text-sm text-gray-800">{{ modalContent }}</div>
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

const showCaptionsModal = ref(false);
const showAIModal = ref(false);
const modalTitle = ref('');
const modalContent = ref('');

function showCaptions(video: any) {
  modalTitle.value = `Napisy: ${video.title}`;
  try {
    if (video.captions) {
      const parsed = typeof video.captions === 'string' ? JSON.parse(video.captions) : video.captions;
      modalContent.value = Array.isArray(parsed) ? parsed.map((s: any) => s.text).join(' ') : String(video.captions);
    } else {
      modalContent.value = 'Brak napisów';
    }
  } catch {
    modalContent.value = String(video.captions || 'Brak napisów');
  }
  showCaptionsModal.value = true;
}

function showAI(video: any) {
  modalTitle.value = `AI: ${video.title}`;
  modalContent.value = video.response || 'Brak odpowiedzi AI';
  showAIModal.value = true;
}

function closeModals() {
  showCaptionsModal.value = false;
  showAIModal.value = false;
}
</script>
