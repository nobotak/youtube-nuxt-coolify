<template>
  <div>
    <h1 class="text-3xl font-bold mb-6 text-slate-100">Videos with Captions</h1>

    <div v-if="pending" class="panel-card p-6">
      <div class="skeleton-line-lg w-56 mb-4" />
      <div class="space-y-3">
        <div v-for="i in 8" :key="`captions-skel-${i}`" class="grid grid-cols-3 gap-3">
          <div class="skeleton-line h-4" />
          <div class="skeleton-line h-4" />
          <div class="skeleton-line h-4" />
        </div>
      </div>
    </div>
    <div v-else-if="error" class="text-center text-red-500">Error loading videos.</div>

    <div v-else class="panel-card p-6">
      <div class="panel-toolbar-sticky grid grid-cols-1 md:grid-cols-2 gap-2">
        <input
          ref="searchInputRef"
          v-model="q"
          type="text"
          placeholder="Szukaj po tytule, kanale, ID..."
          class="panel-input"
        />
        <select
          v-model="sortMode"
          class="panel-input"
        >
          <option value="newest">Najnowsze</option>
          <option value="oldest">Najstarsze</option>
          <option value="title">Tytuł A-Z</option>
        </select>
      </div>
      <div class="mb-4 flex flex-wrap gap-2">
        <span class="stat-chip">Wyniki: {{ videosWithCaptions.length }}</span>
        <button class="stat-chip" :class="{ 'stat-chip-active': sortMode === 'newest' }" @click="sortMode = 'newest'">Najnowsze</button>
        <button class="stat-chip" :class="{ 'stat-chip-active': sortMode === 'oldest' }" @click="sortMode = 'oldest'">Najstarsze</button>
        <button class="stat-chip" :class="{ 'stat-chip-active': sortMode === 'title' }" @click="sortMode = 'title'">Tytul A-Z</button>
      </div>
      <div v-if="videosWithCaptions.length === 0" class="empty-state">
        <div class="empty-state-title">Brak filmow z napisami</div>
        <div class="empty-state-subtitle">Najpierw pobierz napisy na stronie Videos, potem pojawia sie tutaj.</div>
      </div>
      <div v-else class="overflow-auto max-h-[70vh]">
        <table class="panel-table panel-table-sticky">
          <thead>
            <tr>
              <th scope="col" class="px-6 py-3">Title</th>
              <th scope="col" class="px-6 py-3">Channel</th>
              <th scope="col" class="px-6 py-3">Published At</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="video in videosWithCaptions"
              :key="video.video_id"
              class="cursor-pointer hover:bg-slate-800/50"
              @click="openCaptions(video)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-slate-100">{{ video.title }}</div>
                <div class="text-sm text-slate-400">{{ video.video_id }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{{ video.channel_name }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{{ new Date(video.published_at).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showCaptionsModal" class="fixed inset-0 bg-black/70 z-50">
      <div class="w-screen h-screen bg-slate-950 flex flex-col">
        <div class="px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xl font-semibold text-slate-100">{{ modalTitle }}</h3>
            <button @click="closeModal" class="text-slate-300 hover:text-slate-100 text-sm">Zamknij ✕</button>
          </div>

          <div class="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-2">
            <input
              v-model="speakerFrom"
              type="text"
              placeholder="[Speaker 1]"
              class="panel-input"
            />
            <input
              v-model="speakerTo"
              type="text"
              placeholder="Nowa nazwa, np. Prowadzący"
              class="panel-input"
            />
            <button
              @click="replaceSpeakerEverywhere"
              :disabled="!speakerFrom.trim() || !speakerTo.trim() || !editableContent.trim()"
              class="panel-btn-secondary"
            >
              Zamień speakera
            </button>
            <button
              @click="saveCaptions"
              :disabled="isSaving || !activeVideoId"
              class="panel-btn-primary"
            >
              {{ isSaving ? 'Zapisywanie...' : 'Zapisz zmiany' }}
            </button>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <button
              @click="copyTranscript"
              :disabled="!editableContent.trim()"
              class="panel-btn-secondary"
            >
              Kopiuj transkrypt
            </button>
            <a
              href="https://chatgpt.com/g/g-68989e578ce48191baeab194b91907ea-muala-adres-json-v3"
              target="_blank"
              rel="noopener noreferrer"
              class="panel-btn bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Open Chat GPT
            </a>
          </div>

          <div v-if="saveMessage" class="mt-2 text-sm text-emerald-300">{{ saveMessage }}</div>
          <div v-if="saveError" class="mt-2 text-sm text-red-300">{{ saveError }}</div>
        </div>

        <div class="flex-1 p-6">
          <textarea
            v-model="editableContent"
            class="w-full h-full min-h-[300px] resize-none rounded-lg border border-slate-700 bg-slate-900 text-slate-100 p-4 font-mono text-sm leading-6 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const { data: videos, pending, error } = await useFetch('/api/videos');

const videosWithCaptions = computed(() => {
  if (!videos.value) return [];
  const filtered = videos.value.filter((v: any) => v.captions && v.captions !== 'null')
    .filter((v: any) => {
      const term = q.value.trim().toLowerCase();
      if (!term) return true;
      return (v.title || '').toLowerCase().includes(term)
        || (v.channel_name || '').toLowerCase().includes(term)
        || (v.video_id || '').toLowerCase().includes(term);
    });

  if (sortMode.value === 'title') {
    return [...filtered].sort((a: any, b: any) => String(a.title || '').localeCompare(String(b.title || ''), 'pl'));
  }
  if (sortMode.value === 'oldest') {
    return [...filtered].sort((a: any, b: any) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
  }
  return [...filtered].sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
});

const showCaptionsModal = ref(false);
const modalTitle = ref('');
const editableContent = ref('');
const activeVideoId = ref<string | null>(null);
const activeChannelName = ref('');
const speakerFrom = ref('');
const speakerTo = ref('');
const isSaving = ref(false);
const saveMessage = ref('');
const saveError = ref('');
const toast = useToast();
const q = ref('');
const sortMode = ref<'newest' | 'oldest' | 'title'>('newest');
const searchInputRef = ref<HTMLInputElement | null>(null);

const FILTERS_STORAGE_KEY = 'captions-filters-v1';

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

function loadSavedFilters() {
  if (!process.client) return;
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { q?: string; sortMode?: 'newest' | 'oldest' | 'title' };
    if (typeof parsed.q === 'string') q.value = parsed.q;
    if (parsed.sortMode === 'newest' || parsed.sortMode === 'oldest' || parsed.sortMode === 'title') sortMode.value = parsed.sortMode;
  } catch {
    // Ignore localStorage parse errors.
  }
}

function saveFilters() {
  if (!process.client) return;
  try {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({ q: q.value, sortMode: sortMode.value }));
  } catch {
    // Ignore localStorage write errors.
  }
}

function renderCaptionsText(raw: unknown): string {
  if (!raw) return 'Brak napisów';
  if (Array.isArray(raw)) {
    return raw
      .map((segment: any) => {
        const text = String(segment?.text || '').trim();
        if (!text) return '';
        const ts = formatTimestamp(segment?.start);
        return ts ? `[${ts}] ${text}` : text;
      })
      .filter(Boolean)
      .join('\n') || 'Brak napisów';
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((segment: any) => {
            const text = String(segment?.text || '').trim();
            if (!text) return '';
            const ts = formatTimestamp(segment?.start);
            return ts ? `[${ts}] ${text}` : text;
          })
          .filter(Boolean)
          .join('\n') || 'Brak napisów';
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
  editableContent.value = renderCaptionsText(video.captions);
  activeVideoId.value = video.video_id;
  activeChannelName.value = String(video.channel_name || '');
  saveMessage.value = '';
  saveError.value = '';
  speakerFrom.value = '';
  speakerTo.value = '';
  showCaptionsModal.value = true;
}

function closeModal() {
  showCaptionsModal.value = false;
  activeVideoId.value = null;
  activeChannelName.value = '';
}

function replaceSpeakerEverywhere() {
  const from = speakerFrom.value.trim();
  const to = speakerTo.value.trim();
  if (!from || !to) return;
  editableContent.value = editableContent.value.split(from).join(to);
  saveMessage.value = 'Zmieniono nazwy speakerów w całym transkrypcie.';
  saveError.value = '';
  toast.success('Zmieniono nazwy speakerów w całym transkrypcie.');
}

async function copyTranscript() {
  if (!editableContent.value.trim()) return;
  const payload = [
    `Autor: ${activeChannelName.value || 'Nieznany kanał'}`,
    `videoId: ${activeVideoId.value || ''}`,
    '',
    'Transkrypt:',
    editableContent.value.trim(),
  ].join('\n');
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload);
    } else {
      fallbackCopy(payload);
    }
    saveMessage.value = 'Skopiowano transkrypt do schowka.';
    saveError.value = '';
    toast.success('Skopiowano transkrypt do schowka.');
  } catch (err: any) {
    saveError.value = err?.message || 'Nie udało się skopiować transkryptu.';
    toast.error(saveError.value);
  }
}

function formatTimestamp(secondsRaw: unknown): string {
  const seconds = Number(secondsRaw);
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fallbackCopy(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', 'true');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}

async function saveCaptions() {
  if (!activeVideoId.value) return;
  isSaving.value = true;
  saveMessage.value = '';
  saveError.value = '';
  try {
    await $fetch(`/api/captions/${activeVideoId.value}`, {
      method: 'PUT',
      body: { transcript: editableContent.value },
    });

    const list = videos.value || [];
    const target = list.find((v: any) => v.video_id === activeVideoId.value);
    if (target) {
      target.captions = editableContent.value;
    }

    saveMessage.value = 'Zapisano zmiany w bazie.';
    toast.success('Zapisano zmiany w bazie.');
  } catch (err: any) {
    saveError.value = err?.statusMessage || err?.message || 'Nie udało się zapisać zmian.';
    toast.error(saveError.value);
  } finally {
    isSaving.value = false;
  }
}

onMounted(() => {
  loadSavedFilters();
  window.addEventListener('keydown', handleSlashShortcut);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleSlashShortcut);
});

watch([q, sortMode], saveFilters, { immediate: false });
</script>
