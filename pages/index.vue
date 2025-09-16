<template>
  <div>
    <h1 class="text-3xl font-bold">Dashboard</h1>
    <p class="mt-2 text-gray-600 dark:text-gray-300">Welcome to your YouTube Manager dashboard.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      <!-- Total Channels -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
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
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
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
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
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
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
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
          <div v-for="ch in channelsData" :key="ch.channel_id" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <img :src="ch.thumbnail_url" alt="thumb" class="w-16 h-16 rounded-full mr-4"/>
                <div>
                  <div class="text-lg font-semibold truncate max-w-[220px]" :title="ch.channel_name">{{ ch.channel_name }}</div>
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
      <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="hidden md:grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
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

    <!-- Recent videos (last 3 days) -->
    <div class="mt-10 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b">
        <div class="text-lg font-semibold">Nowe filmy (ostatnie 3 dni)</div>
      </div>
      <div class="p-6">
        <div v-if="videosPending" class="text-center">Ładowanie…</div>
        <div v-else-if="videosError" class="text-center text-red-500">Błąd ładowania filmów.</div>
        <div v-else>
          <div v-if="recentVideos.length === 0" class="text-sm text-gray-500">Brak nowych filmów w ostatnich 3 dniach.</div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <th class="text-left px-4 py-2">Video</th>
                  <th class="text-left px-4 py-2">Kanał</th>
                  <th class="text-left px-4 py-2">Data</th>
                  <th class="text-left px-4 py-2">Napisy</th>
                  <th class="text-left px-4 py-2">AI</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in recentVideos" :key="v.video_id" class="border-t border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2">
                    <a :href="`https://www.youtube.com/watch?v=${v.video_id}`" target="_blank" class="text-blue-600 hover:underline">{{ v.title }}</a>
                  </td>
                  <td class="px-4 py-2">{{ v.channel_name }}</td>
                  <td class="px-4 py-2">{{ new Date(v.published_at).toLocaleString('pl-PL') }}</td>
                  <td class="px-4 py-2">
                    <span :class="v.captions ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">{{ v.captions ? '✓' : '—' }}</span>
                  </td>
                  <td class="px-4 py-2">
                    <span :class="v.response ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">{{ v.response ? '✓' : '—' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- API Usage section -->
    <div class="mt-10 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b">
        <div class="text-lg font-semibold">Użycie API YouTube</div>
        <div class="text-gray-500 text-sm">Statystyki zapytań API na dobę</div>
      </div>
      <div class="p-6">
        <div v-if="statsPending" class="text-center">Ładowanie…</div>
        <div v-else-if="statsError" class="text-center text-red-500">Błąd ładowania statystyk.</div>
        <div v-else>
          <div class="mb-2 text-sm text-gray-700 dark:text-gray-300">Zużyte dzisiaj: <span class="font-semibold">{{ statsData.apiUsage.used }}</span> jednostek</div>
          <div class="mb-4 text-sm text-gray-500 dark:text-gray-400">Szacowane zapytania/dobę (na podstawie aktywnych kanałów): <span class="font-semibold">{{ statsData.apiExpected.totalPerDay }}</span></div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <th class="text-left px-4 py-2">Operacja</th>
                  <th class="text-left px-4 py-2">Liczba</th>
                  <th class="text-left px-4 py-2">Koszt</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in statsData.apiUsage.breakdown" :key="row.operation" class="border-t border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2">{{ row.operation }}</td>
                  <td class="px-4 py-2">{{ row.count }}</td>
                  <td class="px-4 py-2">{{ row.cost }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-6">
            <div class="text-sm font-medium mb-2 dark:text-gray-200">Szacun dla kanałów (z interwałów)</div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <th class="text-left px-4 py-2">Kanał</th>
                    <th class="text-left px-4 py-2">Zapytania/dobę</th>
                    <th class="text-left px-4 py-2">Interwał (min)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in statsData.apiExpected.breakdown" :key="row.channel_id" class="border-t border-gray-200 dark:border-gray-700">
                    <td class="px-4 py-2">{{ row.channel_name }}</td>
                    <td class="px-4 py-2">{{ row.perDay }}</td>
                    <td class="px-4 py-2">{{ Math.round(row.intervalMs / 60000) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: channels, pending: channelsPending, error: channelsError, refresh: refreshChannels } = await useFetch('/api/channels');
const { data: videos, pending: videosPending, error: videosError, refresh: refreshVideos } = await useFetch('/api/videos');
const { data: statsData, pending: statsPending, error: statsError, refresh: refreshStats } = await useFetch('/api/stats');

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

const recentVideos = computed(() => {
  const list = videos.value || [];
  const now = Date.now();
  const cutoff = now - 3 * 24 * 60 * 60 * 1000;
  return list.filter((v: any) => {
    const t = new Date(v.published_at).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
});

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
    await Promise.all([refreshChannels(), refreshVideos(), refreshStats()]);
  } catch (e) {
    // no-op display can be added later
  }
}
</script>
