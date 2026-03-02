<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <h1 class="text-3xl font-bold">Videos</h1>
      <button
        @click="triggerCheckVideos"
        :disabled="checkInProgress"
        class="bg-blue-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
      >
        {{ checkInProgress ? 'Trwa sprawdzanie...' : 'Sprawdź nowe filmy' }}
      </button>
    </div>
    <div v-if="checkMessage" class="mb-3 text-sm text-green-600 dark:text-green-400">{{ checkMessage }}</div>
    <div v-if="checkErrorMessage" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ checkErrorMessage }}</div>

    <div v-if="pending" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500">Error loading videos.</div>
    
    <div v-else class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="mb-4">
        <input v-model="q" type="text" placeholder="Szukaj po tytule, kanale, ID, opisie…" class="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400" />
      </div>
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
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
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="video in filteredVideos" :key="video.video_id">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <img :src="video.channel_thumbnail" alt="thumb" class="w-10 h-10 rounded-full"/>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      <a :href="`https://www.youtube.com/watch?v=${video.video_id}`" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">{{ video.title }}</a>
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
              <button
                @click="showCaptions(video)"
                :disabled="getCaptionState(video) === 'loading'"
                class="underline disabled:no-underline disabled:opacity-60"
                :class="getCaptionState(video) === 'error' ? 'text-red-600 hover:text-red-700' : getCaptionState(video) === 'done' ? 'text-green-700 hover:text-green-800' : 'text-gray-700 hover:text-gray-900'"
              >
                {{ captionButtonLabel(video) }}
              </button>
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
const q = ref('');
const checkInProgress = ref(false);
const checkMessage = ref('');
const checkErrorMessage = ref('');
const captionsStatusByVideo = ref<Record<string, 'loading' | 'done' | 'error' | undefined>>({});

const filteredVideos = computed(() => {
  const list = videos.value || [];
  const term = q.value.trim().toLowerCase();
  if (!term) return list;
  return list.filter((v: any) => {
    const title = (v.title || '').toLowerCase();
    const channel = (v.channel_name || '').toLowerCase();
    const id = (v.video_id || '').toLowerCase();
    const desc = (v.snippet?.description || v.description || '').toLowerCase();
    return title.includes(term) || channel.includes(term) || id.includes(term) || desc.includes(term);
  });
});

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

async function triggerCheckVideos() {
  checkInProgress.value = true;
  checkMessage.value = '';
  checkErrorMessage.value = '';
  try {
    await $fetch('/api/tasks/check-videos', { method: 'POST' });
    checkMessage.value = 'Uruchomiono sprawdzanie filmów.';
    await refresh();
  } catch (e) {
    const statusCode = Number((e as any)?.statusCode || (e as any)?.response?.status || 0);
    if (statusCode === 409) {
      checkErrorMessage.value = 'Sprawdzanie już trwa. Poczekaj, aż obecny proces się zakończy.';
    } else {
      checkErrorMessage.value = 'Nie udało się uruchomić sprawdzania filmów.';
    }
  } finally {
    checkInProgress.value = false;
  }
}

const showCaptionsModal = ref(false);
const showAIModal = ref(false);
const modalTitle = ref('');
const modalContent = ref('');

function getCaptionState(video: any): 'loading' | 'done' | 'error' | undefined {
  const state = captionsStatusByVideo.value[video.video_id];
  if (state) return state;
  if (video?.captions) return 'done';
  return undefined;
}

function captionButtonLabel(video: any) {
  const state = getCaptionState(video);
  if (state === 'loading') return 'Pobieranie...';
  if (state === 'done') return 'Gotowe';
  if (state === 'error') return 'Błąd';
  return 'Napisy';
}

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
      // Keep plain string captions untouched.
    }
    return raw;
  }
  return String(raw);
}

async function showCaptions(video: any) {
  modalTitle.value = `Napisy: ${video.title}`;
  showCaptionsModal.value = true;

  if (video?.captions) {
    modalContent.value = renderCaptionsText(video.captions);
    captionsStatusByVideo.value[video.video_id] = 'done';
    return;
  }

  captionsStatusByVideo.value[video.video_id] = 'loading';
  modalContent.value = 'Pobieram transkrypcję...';
  try {
    const response = await $fetch<{ transcript?: string }>(`/api/captions/${video.video_id}`);
    const transcript = response?.transcript || 'Brak treści transkrypcji.';
    modalContent.value = transcript;
    video.captions = transcript;
    captionsStatusByVideo.value[video.video_id] = 'done';
  } catch (err: any) {
    modalContent.value = `Nie udało się pobrać transkrypcji.\n${err?.statusMessage || err?.message || ''}`.trim();
    captionsStatusByVideo.value[video.video_id] = 'error';
  }
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
