<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Videos with Captions</h1>

    <div v-if="pending" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500">Error loading videos.</div>

    <div v-else class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div v-if="videosWithCaptions.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
        Brak filmów z napisami.
      </div>
      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Channel</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Published At</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="video in videosWithCaptions"
            :key="video.video_id"
            class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40"
            @click="openCaptions(video)"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ video.title }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{{ video.video_id }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ video.channel_name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ new Date(video.published_at).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showCaptionsModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCaptionsModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold dark:text-gray-100">{{ modalTitle }}</h3>
          <button @click="showCaptionsModal = false" class="text-gray-600 dark:text-gray-300">✕</button>
        </div>
        <div class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{{ modalContent }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { data: videos, pending, error, refresh } = await useFetch('/api/videos');

const videosWithCaptions = computed(() => {
  if (!videos.value) return [];
  return videos.value.filter((v: any) => v.captions && v.captions !== 'null');
});

const showCaptionsModal = ref(false);
const modalTitle = ref('');
const modalContent = ref('');

function renderCaptionsText(raw: unknown): string {
  if (!raw) return 'Brak napisów';
  if (Array.isArray(raw)) {
    return raw.map((segment: any) => segment?.text || '').join(' ').trim() || 'Brak napisów';
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((segment: any) => segment?.text || '').join(' ').trim() || 'Brak napisów';
      }
    } catch {
      // Keep plain text as-is.
    }
    return raw;
  }
  return String(raw);
}

function openCaptions(video: any) {
  modalTitle.value = `Napisy: ${video.title}`;
  modalContent.value = renderCaptionsText(video.captions);
  showCaptionsModal.value = true;
}
</script>
