<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <h1 class="text-3xl font-bold">Channels</h1>
      <div class="flex items-center gap-2">
        <div class="bg-gray-100 rounded p-1 inline-flex">
          <button class="px-3 py-1 rounded text-sm"
                  :class="viewMode === 'cards' ? 'bg-white shadow text-gray-800' : 'text-gray-600'"
                  @click="viewMode = 'cards'">Karty</button>
          <button class="px-3 py-1 rounded text-sm"
                  :class="viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-600'"
                  @click="viewMode = 'list'">Lista</button>
        </div>
        <button @click="showAddChannelModal = true" class="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600">
          + Add Channel
        </button>
      </div>
    </div>

    <div v-if="pending" class="text-center">Loading...</div>
    <div v-else-if="error" class="text-center text-red-500">Error loading channels.</div>
    <!-- Cards view -->
    <div v-else-if="viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="channel in channels" :key="channel.channel_id" class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <img :src="channel.thumbnail_url" alt="Channel thumbnail" class="w-16 h-16 rounded-full mr-4">
            <div>
              <h2 class="text-xl font-bold">{{ channel.channel_name }}</h2>
              <p class="text-gray-500">{{ channel.channel_id }}</p>
            </div>
          </div>
          <span class="text-xs px-2 py-1 rounded-full"
                :class="channel.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
            {{ channel.is_active ? 'Aktywny' : 'Nieaktywny' }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-4">
          <div class="bg-gray-50 rounded p-3 text-center">
            <div class="text-lg font-semibold">{{ countVideosByChannel(channel.channel_id) }}</div>
            <div class="text-xs text-gray-500">Filmów</div>
          </div>
          <div class="bg-gray-50 rounded p-3 text-center">
            <div class="text-lg font-semibold">{{ countCaptionsByChannel(channel.channel_id) }}</div>
            <div class="text-xs text-gray-500">Napisów</div>
          </div>
          <div class="bg-gray-50 rounded p-3 text-center">
            <div class="text-lg font-semibold">{{ countAIByChannel(channel.channel_id) }}</div>
            <div class="text-xs text-gray-500">Analiz AI</div>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between pt-3 border-t">
          <div class="text-xs text-gray-500">
            Aktualizacja: {{ formatDateTime(channel.last_check) }}
          </div>
          <div class="flex items-center gap-2 text-gray-600">
            <button @click="viewChannel(channel.channel_id)" class="hover:text-gray-800" title="Podgląd">
              <span class="material-symbols-outlined text-base">visibility</span>
            </button>
            <button @click="refreshChannelNow(channel.channel_id)" class="hover:text-gray-800" title="Refresh">
              <span class="material-symbols-outlined text-base">refresh</span>
            </button>
            <button @click="openEdit(channel)" class="hover:text-gray-800" title="Edytuj">
              <span class="material-symbols-outlined text-base">edit</span>
            </button>
            <button @click="confirmRemove(channel)" class="text-red-500 hover:text-red-700" title="Usuń">
              <span class="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- List view -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div class="hidden md:grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
        <div>Kanał</div>
        <div>Status</div>
        <div>Filmów</div>
        <div>Napisy</div>
        <div>Akcje</div>
      </div>
      <div v-for="channel in channels" :key="channel.channel_id" class="grid grid-cols-1 md:grid-cols-5 gap-4 px-6 py-4 border-t">
        <div class="flex items-center gap-3">
          <img :src="channel.thumbnail_url" alt="thumb" class="w-10 h-10 rounded-full"/>
          <div class="min-w-0">
            <div class="font-medium truncate" :title="channel.channel_name">{{ channel.channel_name }}</div>
            <div class="text-gray-500 text-xs truncate" :title="channel.channel_id">{{ channel.channel_id }}</div>
          </div>
        </div>
        <div class="md:text-center">
          <span class="text-xs px-2 py-1 rounded-full"
                :class="channel.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
            {{ channel.is_active ? 'Aktywny' : 'Nieaktywny' }}
          </span>
        </div>
        <div class="md:text-center text-sm">{{ countVideosByChannel(channel.channel_id) }}</div>
        <div class="md:text-center text-sm">{{ countCaptionsByChannel(channel.channel_id) }}</div>
        <div class="md:text-center flex items-center gap-3">
          <button @click="viewChannel(channel.channel_id)" class="hover:text-gray-800" title="Podgląd">
            <span class="material-symbols-outlined text-base">visibility</span>
          </button>
          <button @click="refreshChannelNow(channel.channel_id)" class="hover:text-gray-800" title="Refresh">
            <span class="material-symbols-outlined text-base">refresh</span>
          </button>
          <button @click="openEdit(channel)" class="hover:text-gray-800" title="Edytuj">
            <span class="material-symbols-outlined text-base">edit</span>
          </button>
          <button @click="confirmRemove(channel)" class="text-red-500 hover:text-red-700" title="Usuń">
            <span class="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Add Channel Modal -->
    <div v-if="showAddChannelModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-lg w-1/3">
        <h2 class="text-2xl font-bold mb-4">Add New Channel</h2>
        <form @submit.prevent="addChannel">
          <div class="mb-4">
            <label for="channel_id" class="block text-gray-700">Channel ID or URL</label>
            <input type="text" v-model="newChannel.channel_id" id="channel_id" class="w-full px-3 py-2 border rounded-lg" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-700">Interwał sprawdzania</label>
            <div class="flex gap-2">
              <input type="number" min="5" v-model.number="intervalValue" class="w-1/2 px-3 py-2 border rounded-lg">
              <select v-model="intervalUnit" class="w-1/2 px-3 py-2 border rounded-lg">
                <option value="min">minut</option>
                <option value="h">godzin</option>
                <option value="d">dni</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showAddChannelModal = false" class="text-gray-600 mr-4">Cancel</button>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-lg">Add Channel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: channels, pending, error, refresh } = await useFetch('/api/channels');
const { data: videos } = await useFetch('/api/videos');

const showAddChannelModal = ref(false);
const newChannel = ref({
  channel_id: '',
});

// Interwał: wartość + jednostka (jak w "old")
const intervalValue = ref<number>(30);
const intervalUnit = ref<'min' | 'h' | 'd'>('min');

const viewMode = ref<'cards' | 'list'>('cards');

function countVideosByChannel(channelId: string): number {
  if (!videos.value) return 0;
  return videos.value.filter((v: any) => v.channel_id === channelId).length;
}
function countCaptionsByChannel(channelId: string): number {
  if (!videos.value) return 0;
  return videos.value.filter((v: any) => v.channel_id === channelId && !!v.captions).length;
}
function countAIByChannel(channelId: string): number {
  if (!videos.value) return 0;
  return videos.value.filter((v: any) => v.channel_id === channelId && !!v.response).length;
}

function formatDateTime(value?: string) {
  if (!value) return 'Nigdy';
  try { return new Date(value).toLocaleString('pl-PL'); } catch { return String(value); }
}

async function viewChannel(channelId: string) {
  window.alert(`Podgląd kanału: ${channelId}`);
}

async function refreshChannelNow(channelId: string) {
  try {
    await $fetch('/api/tasks/check-videos', { method: 'POST' });
    await refresh();
  } catch {}
}

function openEdit(channel: any) {
  window.alert(`Edytuj: ${channel.channel_name}`);
}

async function confirmRemove(channel: any) {
  if (confirm(`Czy na pewno usunąć kanał "${channel.channel_name}"?`)) {
    await deleteChannel(channel.channel_id);
  }
}

async function addChannel() {
  // Przelicz na milisekundy
  const minutes = intervalUnit.value === 'min'
    ? intervalValue.value
    : intervalUnit.value === 'h'
      ? intervalValue.value * 60
      : intervalValue.value * 1440;
  const checkIntervalMs = Math.max(5, Number(minutes || 0)) * 60_000;

  await $fetch('/api/channels', {
    method: 'POST',
    body: {
      ...newChannel.value,
      check_interval: checkIntervalMs,
    },
  });
  showAddChannelModal.value = false;
  newChannel.value = { channel_id: '' };
  intervalValue.value = 30;
  intervalUnit.value = 'min';
  refresh();
}

async function deleteChannel(channelId: string) {
    if (confirm('Are you sure you want to delete this channel?')) {
        await $fetch(`/api/channels/${channelId}`, {
            method: 'DELETE',
        });
        refresh();
    }
}
</script>
