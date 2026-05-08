<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <h1 class="text-3xl font-bold text-slate-100">Videos</h1>
      <button
        @click="triggerCheckVideos"
        :disabled="checkInProgress"
        class="panel-btn-primary"
      >
        {{ checkInProgress ? 'Trwa sprawdzanie...' : 'Sprawdź nowe filmy' }}
      </button>
    </div>

    <div v-if="pending" class="panel-card p-6">
      <div class="skeleton-line-lg w-48 mb-4" />
      <div class="space-y-3">
        <div v-for="i in 8" :key="`videos-skel-${i}`" class="grid grid-cols-7 gap-3 items-center">
          <div class="skeleton-line h-4" />
          <div class="skeleton-line h-4 col-span-2" />
          <div class="skeleton-line h-4" />
          <div class="skeleton-line h-4" />
          <div class="skeleton-line h-4" />
          <div class="skeleton-line h-4" />
        </div>
      </div>
    </div>
    <div v-else-if="error" class="text-center text-red-500">Error loading videos.</div>
    
    <div v-else class="panel-card p-6">
      <div class="panel-toolbar-sticky">
        <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <div class="text-sm text-slate-300">
            Zaznaczone: <span class="font-semibold">{{ selectedVideoIds.length }}</span>
          </div>
          <button
            @click="runBatchCaptions"
            :disabled="batchInProgress || selectedVideoIds.length === 0"
            class="panel-btn-secondary"
          >
            {{ batchInProgress ? 'Przetwarzanie...' : 'Pobierz napisy dla zaznaczonych' }}
          </button>
          <input
            v-model="batchAssistantId"
            type="text"
            placeholder="assistantId do batch AI"
            class="panel-input text-sm md:min-w-[280px]"
          />
          <button
            @click="runBatchAI"
            :disabled="batchInProgress || selectedVideoIds.length === 0 || !batchAssistantId.trim()"
            class="panel-btn-primary"
          >
            Batch AI dla zaznaczonych
          </button>
        </div>
      </div>

      <div class="mb-4 panel-card-soft p-3">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <label class="lg:col-span-5 text-xs text-slate-400">
            Szukaj
            <input ref="searchInputRef" v-model="q" type="text" placeholder="Tytul, kanal, ID, opis..." class="panel-input mt-1" />
          </label>
          <label class="lg:col-span-3 text-xs text-slate-400">
            Kanal
            <select v-model="filterChannelId" class="panel-input mt-1">
              <option value="">Wszystkie kanały</option>
              <option v-for="ch in channelOptions" :key="ch.channel_id" :value="ch.channel_id">{{ ch.channel_name }}</option>
            </select>
          </label>
          <label class="lg:col-span-2 text-xs text-slate-400">
            Napisy
            <select v-model="filterCaptions" class="panel-input mt-1">
              <option value="all">Wszystkie</option>
              <option value="with">Tylko z napisami</option>
              <option value="without">Tylko bez napisów</option>
            </select>
          </label>
          <label class="lg:col-span-2 text-xs text-slate-400">
            AI
            <select v-model="filterAI" class="panel-input mt-1">
              <option value="all">Wszystkie</option>
              <option value="with">Tylko z analizą</option>
              <option value="without">Tylko bez analizy</option>
            </select>
          </label>
          <label class="lg:col-span-4 text-xs text-slate-400">
            Sortowanie
            <select v-model="sortMode" class="panel-input mt-1">
              <option value="date_desc">Data: najnowsze</option>
              <option value="date_asc">Data: najstarsze</option>
              <option value="title_asc">Tytuł: A-Z</option>
              <option value="title_desc">Tytuł: Z-A</option>
            </select>
          </label>
          <div class="lg:col-span-8 flex items-end justify-end">
            <button class="panel-btn-secondary" @click="resetQuickFilters">Reset filtrów</button>
          </div>
        </div>
      </div>
      <div class="mb-4 flex flex-wrap gap-2">
        <button class="stat-chip" :class="{ 'stat-chip-active': filterCaptions === 'with' }" @click="filterCaptions = 'with'">
          Napisy: {{ captionsReadyCount }}
        </button>
        <button class="stat-chip" :class="{ 'stat-chip-active': filterCaptions === 'without' }" @click="filterCaptions = 'without'">
          Bez napisow: {{ captionsMissingCount }}
        </button>
        <button class="stat-chip" :class="{ 'stat-chip-active': filterAI === 'with' }" @click="filterAI = 'with'">
          AI gotowe: {{ aiReadyCount }}
        </button>
        <button class="stat-chip" :class="{ 'stat-chip-active': filterAI === 'without' }" @click="filterAI = 'without'">
          Bez AI: {{ aiMissingCount }}
        </button>
        <button class="stat-chip" @click="resetQuickFilters">Reset filtrow</button>
      </div>
      <div v-if="filteredVideos.length === 0" class="empty-state">
        <div class="empty-state-title">Brak wynikow dla aktualnych filtrow</div>
        <div class="empty-state-subtitle">Zmien filtry lub wyszukiwane haslo, aby zobaczyc filmy.</div>
      </div>
      <div v-else class="overflow-auto max-h-[70vh]">
        <table class="panel-table panel-table-sticky">
          <thead>
            <tr>
              <th scope="col" class="px-4 py-3">
                <input type="checkbox" :checked="allVisibleSelected" @change="toggleSelectAllVisible" />
              </th>
              <th scope="col" class="px-6 py-3">Video</th>
              <th scope="col" class="px-6 py-3">Channel</th>
              <th scope="col" class="px-6 py-3">Published At</th>
              <th scope="col" class="px-6 py-3">Type</th>
              <th scope="col" class="px-6 py-3">Napisy</th>
              <th scope="col" class="px-6 py-3">AI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="video in filteredVideos" :key="video.video_id">
            <td class="px-4 py-4 whitespace-nowrap">
              <input type="checkbox" :checked="selectedSet.has(video.video_id)" @change="toggleVideoSelection(video.video_id)" />
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                  <img :src="video.channel_thumbnail" alt="thumb" class="w-10 h-10 rounded-full"/>
                  <div>
                    <div class="text-sm font-medium text-slate-100">
                      <a :href="`https://www.youtube.com/watch?v=${video.video_id}`" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">{{ video.title }}</a>
                    </div>
                    <div class="text-xs text-slate-400">{{ video.video_id }}</div>
                  </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{{ video.channel_name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{{ new Date(video.published_at).toLocaleDateString() }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="video.type === 'short' ? 'bg-blue-900/40 text-blue-300' : 'bg-emerald-900/40 text-emerald-300'">
                    {{ video.type }}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button
                @click="showCaptions(video)"
                :disabled="getCaptionState(video) === 'loading'"
                class="underline disabled:no-underline disabled:opacity-60"
                :class="getCaptionState(video) === 'error' ? 'text-red-400 hover:text-red-300' : getCaptionState(video) === 'done' ? 'text-emerald-300 hover:text-emerald-200' : 'text-slate-300 hover:text-slate-100'"
              >
                {{ captionButtonLabel(video) }}
              </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button @click="showAI(video)" class="text-slate-300 hover:text-slate-100 underline">AI</button>
            </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
  
  <!-- Modals: Captions / AI -->
  <div v-if="showCaptionsModal || showAIModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="closeModals">
    <div class="panel-card p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-slate-100">{{ modalTitle }}</h3>
        <button @click="closeModals" class="text-slate-400 hover:text-slate-200">✕</button>
      </div>
      <div class="whitespace-pre-wrap text-sm text-slate-200">{{ modalContent }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { data: videos, pending, error, refresh } = await useFetch('/api/videos');
const q = ref('');
const checkInProgress = ref(false);
const captionsStatusByVideo = ref<Record<string, 'loading' | 'done' | 'error' | undefined>>({});
const toast = useToast();
const { setContextualActions, clearContextualActions } = useCommandPaletteActions();
const searchInputRef = ref<HTMLInputElement | null>(null);
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
const allVideos = computed<any[]>(() => (videos.value || []) as any[]);
const captionsReadyCount = computed(() => allVideos.value.filter((v: any) => !!v.captions).length);
const captionsMissingCount = computed(() => allVideos.value.length - captionsReadyCount.value);
const aiReadyCount = computed(() => allVideos.value.filter((v: any) => !!v.response).length);
const aiMissingCount = computed(() => allVideos.value.length - aiReadyCount.value);
const allVisibleSelected = computed(() => {
  const ids = filteredVideos.value.map((v: any) => v.video_id).filter(Boolean);
  if (ids.length === 0) return false;
  return ids.every((id: string) => selectedSet.value.has(id));
});

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  return false;
}

function handleSlashShortcut(event: KeyboardEvent) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
  if (isTypingTarget(event.target)) return;
  event.preventDefault();
  searchInputRef.value?.focus();
}

const FILTERS_STORAGE_KEY = 'videos-filters-v1';

function loadSavedFilters() {
  if (!process.client) return;
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      q?: string;
      filterChannelId?: string;
      filterCaptions?: 'all' | 'with' | 'without';
      filterAI?: 'all' | 'with' | 'without';
      sortMode?: 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc';
    };
    if (typeof parsed.q === 'string') q.value = parsed.q;
    if (typeof parsed.filterChannelId === 'string') filterChannelId.value = parsed.filterChannelId;
    if (parsed.filterCaptions === 'all' || parsed.filterCaptions === 'with' || parsed.filterCaptions === 'without') filterCaptions.value = parsed.filterCaptions;
    if (parsed.filterAI === 'all' || parsed.filterAI === 'with' || parsed.filterAI === 'without') filterAI.value = parsed.filterAI;
    if (parsed.sortMode === 'date_desc' || parsed.sortMode === 'date_asc' || parsed.sortMode === 'title_asc' || parsed.sortMode === 'title_desc') sortMode.value = parsed.sortMode;
  } catch {
    // Ignore localStorage parse errors.
  }
}

function saveFilters() {
  if (!process.client) return;
  try {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        q: q.value,
        filterChannelId: filterChannelId.value,
        filterCaptions: filterCaptions.value,
        filterAI: filterAI.value,
        sortMode: sortMode.value,
      })
    );
  } catch {
    // Ignore localStorage write errors.
  }
}

function resetQuickFilters() {
  filterCaptions.value = 'all';
  filterAI.value = 'all';
  filterChannelId.value = '';
  q.value = '';
}

async function runBatchCaptionsFromPalette() {
  if (selectedVideoIds.value.length === 0) {
    toast.info('Najpierw zaznacz filmy, aby pobrac napisy.');
    return;
  }
  await runBatchCaptions();
}

function syncContextualCommandActions() {
  setContextualActions([
    {
      id: 'videos-check-new',
      label: 'Videos: Sprawdz nowe filmy',
      hint: checkInProgress.value ? 'Sprawdzanie w toku' : 'Uruchom reczne sprawdzenie nowych filmow',
      keywords: 'videos check nowe filmy task',
      run: () => triggerCheckVideos(),
    },
    {
      id: 'videos-reset-filters',
      label: 'Videos: Reset filtrow',
      hint: 'Wyczysc wyszukiwanie i filtry',
      keywords: 'videos reset filtrow clear',
      run: () => resetQuickFilters(),
    },
    {
      id: 'videos-batch-captions',
      label: 'Videos: Pobierz napisy dla zaznaczonych',
      hint: `Zaznaczone: ${selectedVideoIds.value.length}`,
      keywords: 'videos batch captions napisy zaznaczone',
      run: () => runBatchCaptionsFromPalette(),
    },
  ]);
}

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

onMounted(() => {
  loadSavedFilters();
  syncContextualCommandActions();
  window.addEventListener('keydown', handleSlashShortcut);
});

onBeforeUnmount(() => {
  clearContextualActions();
  window.removeEventListener('keydown', handleSlashShortcut);
});

watch([q, filterChannelId, filterCaptions, filterAI, sortMode], saveFilters, { immediate: false });
watch([selectedVideoIds, checkInProgress], syncContextualCommandActions, { deep: true });
</script>
