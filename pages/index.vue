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

    <!-- Channels section -->
    <div class="mt-10">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 class="text-xl font-semibold">Kanały YouTube</h2>
        <div class="flex items-center gap-2">
          <div class="bg-gray-100 rounded p-1 inline-flex">
            <button class="px-3 py-1 rounded text-sm"
                    :class="viewMode === 'cards' ? 'bg-white shadow text-gray-800' : 'text-gray-600'"
                    @click="viewMode = 'cards'">Karty</button>
            <button class="px-3 py-1 rounded text-sm"
                    :class="viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-600'"
                    @click="viewMode = 'list'">Lista</button>
          </div>
          <button @click="triggerCheckVideos" class="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm">
            Sprawdź nowe filmy
          </button>
        </div>
      </div>

      <!-- Cards view -->
      <div v-if="viewMode === 'cards'">
        <div v-if="channelsPending" class="text-center">Ładowanie kanałów...</div>
        <div v-else-if="channelsError" class="text-center text-red-500">Błąd ładowania kanałów.</div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="ch in channelsData" :key="ch.channel_id" class="bg-white p-6 rounded-lg shadow">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <img :src="ch.thumbnail_url" alt="thumb" class="w-16 h-16 rounded-full mr-4"/>
                <div>
                  <div class="text-lg font-semibold truncate max-w-[220px]" :title="ch.channel_name">{{ ch.channel_name }}</div>
                  <div class="text-gray-500 text-sm truncate max-w-[220px]" :title="ch.channel_id">{{ ch.channel_id }}</div>
                </div>
              </div>
              <span class="text-xs px-2 py-1 rounded-full"
                    :class="ch.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
                {{ ch.is_active ? 'Aktywny' : 'Nieaktywny' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- List view -->
      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <div class="hidden md:grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          <div>Kanał</div>
          <div>Status</div>
          <div>Filmy</div>
          <div>Napisy</div>
          <div>Analiz AI</div>
        </div>
        <div v-for="ch in channelsData" :key="ch.channel_id" class="grid grid-cols-1 md:grid-cols-5 gap-4 px-6 py-4 border-t">
          <div class="flex items-center gap-3">
            <img :src="ch.thumbnail_url" alt="thumb" class="w-10 h-10 rounded-full"/>
            <div class="min-w-0">
              <div class="font-medium truncate" :title="ch.channel_name">{{ ch.channel_name }}</div>
              <div class="text-gray-500 text-xs truncate" :title="ch.channel_id">{{ ch.channel_id }}</div>
            </div>
          </div>
          <div class="md:text-center">
            <span class="text-xs px-2 py-1 rounded-full"
                  :class="ch.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
              {{ ch.is_active ? 'Aktywny' : 'Nieaktywny' }}
            </span>
          </div>
          <div class="md:text-center text-sm">{{ countVideosByChannel(ch.channel_id) }}</div>
          <div class="md:text-center text-sm">{{ countCaptionsByChannel(ch.channel_id) }}</div>
          <div class="md:text-center text-sm">{{ countAIByChannel(ch.channel_id) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: channels, pending: channelsPending, error: channelsError, refresh: refreshChannels } = await useFetch('/api/channels');
const { data: videos, pending: videosPending, error: videosError, refresh: refreshVideos } = await useFetch('/api/videos');

const stats = computed(() => {
  if (!channels.value || !videos.value) {
    return {
      totalChannels: 0,
      activeChannels: 0,
      totalVideos: 0,
      totalAI: 0,
    };
  }

  const activeChannels = channels.value.filter((c: any) => c.is_active).length;
  const totalVideos = videos.value.length;
  const totalAI = videos.value.filter((v: any) => !!v.response).length;

  return {
    totalChannels: channels.value.length,
    activeChannels,
    totalVideos,
    totalAI,
  };
});

const viewMode = ref<'cards' | 'list'>('cards');
const channelsData = computed(() => channels.value || []);

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

async function triggerCheckVideos() {
  try {
    await $fetch('/api/tasks/check-videos', { method: 'POST' });
    await Promise.all([refreshChannels(), refreshVideos()]);
  } catch (e) {
    // no-op display can be added later
  }
}
</script>
