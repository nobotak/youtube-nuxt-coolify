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

    <div v-if="pending" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500">Error loading videos.</div>
    
    <div v-else class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="mb-4 p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
        <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Zaznaczone: <span class="font-semibold">{{ selectedVideoIds.length }}</span>
          </div>
          <button
            @click="runBatchCaptions"
            :disabled="batchInProgress || selectedVideoIds.length === 0"
            class="px-3 py-2 rounded text-sm bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ batchInProgress ? 'Przetwarzanie...' : 'Pobierz napisy dla zaznaczonych' }}
          </button>
          <input
            v-model="batchAssistantId"
            type="text"
            placeholder="assistantId do batch AI"
            class="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm md:min-w-[280px]"
          />
          <button
            @click="runBatchAI"
            :disabled="batchInProgress || selectedVideoIds.length === 0 || !batchAssistantId.trim()"
            class="px-3 py-2 rounded text-sm bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batch AI dla zaznaczonych
          </button>
        </div>
      </div>

      <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        <input v-model="q" type="text" placeholder="Szukaj po tytule, kanale, ID, opisie…" class="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400" />
        <select v-model="filterChannelId" class="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option value="">Wszystkie kanały</option>
          <option v-for="ch in channelOptions" :key="ch.channel_id" :value="ch.channel_id">{{ ch.channel_name }}</option>
        </select>
        <select v-model="filterCaptions" class="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option value="all">Napisy: wszystkie</option>
          <option value="with">Napisy: tylko z napisami</option>
          <option value="without">Napisy: tylko bez napisów</option>
        </select>
        <select v-model="filterAI" class="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option value="all">AI: wszystkie</option>
          <option value="with">AI: tylko z analizą</option>
          <option value="without">AI: tylko bez analizy</option>
        </select>
        <select v-model="sortMode" class="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 md:col-span-2">
          <option value="date_desc">Sortuj: data (najnowsze)</option>
          <option value="date_asc">Sortuj: data (najstarsze)</option>
          <option value="title_asc">Sortuj: tytuł A-Z</option>
          <option value="title_desc">Sortuj: tytuł Z-A</option>
        </select>
      </div>
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input type="checkbox" :checked="allVisibleSelected" @change="toggleSelectAllVisible" />
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published At</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Napisy</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="video in filteredVideos" :key="video.video_id">
            <td class="px-4 py-4 whitespace-nowrap">
              <input type="checkbox" :checked="selectedSet.has(video.video_id)" @change="toggleVideoSelection(video.video_id)" />
            </td>
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
const captionsStatusByVideo = ref<Record<string, 'loading' | 'done' | 'error' | undefined>>({});
const toast = useToast();
const filterChannelId = ref('');
const filterCaptions = ref<'all' | 'with' | 'without'>('all');
const filterAI = ref<'all' | 'with' | 'without'>('all');
const sortMode = ref<'date_desc' | 'date_asc' | 'title_asc' | 'title_desc'>('date_desc');
const selectedVideoIds = ref<string[]>([]);
const batchInProgress = ref(false);
const batchAssistantId = ref('');

const channelOptions = computed(() => {
  const list = videos.value || [];
  const map = new Map<string, string>();
  for (const v of list as any[]) {
    if (!v?.channel_id) continue;
    if (!map.has(v.channel_id)) {
      map.set(v.channel_id, v.channel_name || v.channel_id);
    }
  }
  return Array.from(map.entries())
    .map(([channel_id, channel_name]) => ({ channel_id, channel_name }))
    .sort((a, b) => a.channel_name.localeCompare(b.channel_name, 'pl'));
});

const selectedSet = computed(() => new Set(selectedVideoIds.value));
const allVisibleSelected = computed(() => {
  const ids = filteredVideos.value.map((v: any) => v.video_id).filter(Boolean);
  if (ids.length === 0) return false;
  return ids.every((id: string) => selectedSet.value.has(id));
});

const filteredVideos = computed(() => {
  const list = videos.value || [];
  const term = q.value.trim().toLowerCase();
  const filtered = list.filter((v: any) => {
    const title = (v.title || '').toLowerCase();
    const channel = (v.channel_name || '').toLowerCase();
    const id = (v.video_id || '').toLowerCase();
    const desc = (v.snippet?.description || v.description || '').toLowerCase();
    const matchesSearch = !term || title.includes(term) || channel.includes(term) || id.includes(term) || desc.includes(term);
    const matchesChannel = !filterChannelId.value || v.channel_id === filterChannelId.value;
    const hasCaptions = !!v.captions;
    const matchesCaptions = filterCaptions.value === 'all'
      || (filterCaptions.value === 'with' && hasCaptions)
      || (filterCaptions.value === 'without' && !hasCaptions);
    const hasAI = !!v.response;
    const matchesAI = filterAI.value === 'all'
      || (filterAI.value === 'with' && hasAI)
      || (filterAI.value === 'without' && !hasAI);
    return matchesSearch && matchesChannel && matchesCaptions && matchesAI;
  });

  if (sortMode.value === 'title_asc') {
    return [...filtered].sort((a: any, b: any) => String(a.title || '').localeCompare(String(b.title || ''), 'pl'));
  }
  if (sortMode.value === 'title_desc') {
    return [...filtered].sort((a: any, b: any) => String(b.title || '').localeCompare(String(a.title || ''), 'pl'));
  }
  if (sortMode.value === 'date_asc') {
    return [...filtered].sort((a: any, b: any) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
  }
  return [...filtered].sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
});

async function triggerCheckVideos() {
  checkInProgress.value = true;
  try {
    await $fetch('/api/tasks/check-videos', { method: 'POST' });
    toast.success('Uruchomiono sprawdzanie filmów.');
    await refresh();
  } catch (e) {
    const statusCode = Number((e as any)?.statusCode || (e as any)?.response?.status || 0);
    if (statusCode === 409) {
      toast.info('Sprawdzanie już trwa. Poczekaj, aż obecny proces się zakończy.');
    } else {
      toast.error('Nie udało się uruchomić sprawdzania filmów.');
    }
  } finally {
    checkInProgress.value = false;
  }
}

function toggleVideoSelection(videoId: string) {
  if (selectedSet.value.has(videoId)) {
    selectedVideoIds.value = selectedVideoIds.value.filter((id) => id !== videoId);
  } else {
    selectedVideoIds.value = [...selectedVideoIds.value, videoId];
  }
}

function toggleSelectAllVisible() {
  const visible = filteredVideos.value.map((v: any) => String(v.video_id || '')).filter(Boolean);
  if (visible.length === 0) return;
  if (allVisibleSelected.value) {
    selectedVideoIds.value = selectedVideoIds.value.filter((id) => !visible.includes(id));
    return;
  }
  const set = new Set(selectedVideoIds.value);
  for (const id of visible) set.add(id);
  selectedVideoIds.value = Array.from(set);
}

async function runBatchCaptions() {
  if (selectedVideoIds.value.length === 0) return;
  batchInProgress.value = true;
  try {
    const result = await $fetch<any>('/api/videos/batch', {
      method: 'POST',
      body: {
        action: 'captions',
        videoIds: selectedVideoIds.value,
      },
    });
    await refresh();
    toast.success(`Napisy batch: zaktualizowano ${result.updated}/${result.processed}.`);
    if (result.failed?.length) {
      toast.error(`Błędy batch napisów: ${result.failed.length}.`);
    }
  } catch (e: any) {
    toast.error(e?.statusMessage || e?.message || 'Batch napisów nie powiódł się.');
  } finally {
    batchInProgress.value = false;
  }
}

async function runBatchAI() {
  if (selectedVideoIds.value.length === 0 || !batchAssistantId.value.trim()) return;
  batchInProgress.value = true;
  try {
    const result = await $fetch<any>('/api/videos/batch', {
      method: 'POST',
      body: {
        action: 'ai',
        assistantId: batchAssistantId.value.trim(),
        videoIds: selectedVideoIds.value,
      },
    });
    await refresh();
    toast.success(`Batch AI: zaktualizowano ${result.updated}/${result.processed}.`);
    if (result.failed?.length) {
      toast.error(`Błędy batch AI: ${result.failed.length}.`);
    }
  } catch (e: any) {
    toast.error(e?.statusMessage || e?.message || 'Batch AI nie powiódł się.');
  } finally {
    batchInProgress.value = false;
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
    toast.error('Nie udało się pobrać transkrypcji.');
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
