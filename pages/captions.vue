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

    <div v-if="showCaptionsModal" class="fixed inset-0 bg-black/70 z-50">
      <div class="w-screen h-screen bg-white dark:bg-gray-900 flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-xl font-semibold dark:text-gray-100">{{ modalTitle }}</h3>
            <button @click="closeModal" class="text-gray-600 dark:text-gray-300 text-sm">Zamknij ✕</button>
          </div>

          <div class="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-2">
            <input
              v-model="speakerFrom"
              type="text"
              placeholder="[Speaker 1]"
              class="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <input
              v-model="speakerTo"
              type="text"
              placeholder="Nowa nazwa, np. Prowadzący"
              class="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              @click="replaceSpeakerEverywhere"
              :disabled="!speakerFrom.trim() || !speakerTo.trim() || !editableContent.trim()"
              class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zamień speakera
            </button>
            <button
              @click="saveCaptions"
              :disabled="isSaving || !activeVideoId"
              class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSaving ? 'Zapisywanie...' : 'Zapisz zmiany' }}
            </button>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <button
              @click="copyTranscript"
              :disabled="!editableContent.trim()"
              class="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Kopiuj transkrypt
            </button>
            <a
              href="https://chatgpt.com/g/g-68989e578ce48191baeab194b91907ea-muala-adres-json-v3"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
            >
              Open Chat GPT
            </a>
          </div>

          <div v-if="saveMessage" class="mt-2 text-sm text-green-600 dark:text-green-400">{{ saveMessage }}</div>
          <div v-if="saveError" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ saveError }}</div>
        </div>

        <div class="flex-1 p-6">
          <textarea
            v-model="editableContent"
            class="w-full h-full min-h-[300px] resize-none rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 font-mono text-sm leading-6"
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
  return videos.value.filter((v: any) => v.captions && v.captions !== 'null');
});

const showCaptionsModal = ref(false);
const modalTitle = ref('');
const editableContent = ref('');
const activeVideoId = ref<string | null>(null);
const speakerFrom = ref('');
const speakerTo = ref('');
const isSaving = ref(false);
const saveMessage = ref('');
const saveError = ref('');

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
  editableContent.value = renderCaptionsText(video.captions);
  activeVideoId.value = video.video_id;
  saveMessage.value = '';
  saveError.value = '';
  speakerFrom.value = '';
  speakerTo.value = '';
  showCaptionsModal.value = true;
}

function closeModal() {
  showCaptionsModal.value = false;
  activeVideoId.value = null;
}

function replaceSpeakerEverywhere() {
  const from = speakerFrom.value.trim();
  const to = speakerTo.value.trim();
  if (!from || !to) return;
  editableContent.value = editableContent.value.split(from).join(to);
  saveMessage.value = 'Zmieniono nazwy speakerów w całym transkrypcie.';
  saveError.value = '';
}

async function copyTranscript() {
  if (!editableContent.value.trim()) return;
  try {
    await navigator.clipboard.writeText(editableContent.value);
    saveMessage.value = 'Skopiowano transkrypt do schowka.';
    saveError.value = '';
  } catch (err: any) {
    saveError.value = err?.message || 'Nie udało się skopiować transkryptu.';
  }
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
  } catch (err: any) {
    saveError.value = err?.statusMessage || err?.message || 'Nie udało się zapisać zmian.';
  } finally {
    isSaving.value = false;
  }
}
</script>
