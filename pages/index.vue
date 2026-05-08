<template>
  <div>
    <h1 class="text-3xl font-bold text-slate-100">Dashboard</h1>
    <p class="mt-2 panel-subtitle">Welcome to your YouTube Manager dashboard.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      <!-- Total Channels -->
      <div class="panel-card p-6">
        <div class="flex items-center">
          <div class="bg-blue-500 text-white p-3 rounded-full">
            <span class="text-2xl">📺</span>
          </div>
          <div class="ml-4">
            <p class="panel-subtitle">Total Channels</p>
            <p class="text-2xl font-bold">{{ stats.totalChannels }}</p>
          </div>
        </div>
      </div>

      <!-- Active Channels -->
      <div class="panel-card p-6">
        <div class="flex items-center">
          <div class="bg-green-500 text-white p-3 rounded-full">
            <span class="text-2xl">●</span>
          </div>
          <div class="ml-4">
            <p class="panel-subtitle">Active Channels</p>
            <p class="text-2xl font-bold">{{ stats.activeChannels }}</p>
          </div>
        </div>
      </div>

      <!-- Total Videos -->
      <div class="panel-card p-6">
        <div class="flex items-center">
          <div class="bg-purple-500 text-white p-3 rounded-full">
            <span class="text-2xl">🎬</span>
          </div>
          <div class="ml-4">
            <p class="panel-subtitle">Total Videos</p>
            <p class="text-2xl font-bold">{{ stats.totalVideos }}</p>
          </div>
        </div>
      </div>

      <!-- AI Analysis -->
      <div class="panel-card p-6">
        <div class="flex items-center">
          <div class="bg-red-500 text-white p-3 rounded-full">
            <span class="text-2xl">⚡</span>
          </div>
          <div class="ml-4">
            <p class="panel-subtitle">AI Analysis</p>
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
          <div class="bg-slate-800 rounded p-1 inline-flex">
            <button class="px-3 py-1 rounded text-sm"
                    :class="viewMode === 'cards' ? 'bg-slate-700 shadow text-white' : 'text-slate-400'"
                    @click="viewMode = 'cards'">Karty</button>
            <button class="px-3 py-1 rounded text-sm"
                    :class="viewMode === 'list' ? 'bg-slate-700 shadow text-white' : 'text-slate-400'"
                    @click="viewMode = 'list'">Lista</button>
          </div>
          <button
            @click="triggerCheckVideos"
            :disabled="checkInProgress"
            class="panel-btn-primary"
          >
            {{ checkInProgress ? 'Trwa sprawdzanie...' : 'Sprawdź nowe filmy' }}
          </button>
        </div>
      </div>

      <!-- Cards view -->
      <div v-if="channelsPending" class="text-center">Ładowanie kanałów...</div>
      <div v-else-if="channelsError" class="text-center text-red-500">Błąd ładowania kanałów.</div>
      <div v-else-if="viewMode === 'cards'">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="ch in channelsData" :key="ch.channel_id" class="panel-card p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <img :src="ch.thumbnail_url" alt="thumb" class="w-16 h-16 rounded-full mr-4"/>
                <div>
                  <div class="text-lg font-semibold truncate max-w-[220px]" :title="ch.channel_name">{{ ch.channel_name }}</div>
                </div>
              </div>
              <span
                class="text-xs px-2 py-1 rounded-full"
                :class="ch.is_active ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-800 text-slate-300'"
              >
                {{ ch.is_active ? 'Aktywny' : 'Nieaktywny' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- List view -->
      <div v-else class="panel-card overflow-hidden">
        <div class="hidden md:grid grid-cols-5 gap-4 px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          <div>Kanał</div>
          <div>Status</div>
          <div>Filmy</div>
          <div>Napisy</div>
          <div>Analiz AI</div>
        </div>
        <div v-for="ch in channelsData" :key="ch.channel_id" class="grid grid-cols-1 md:grid-cols-5 gap-4 px-6 py-4 border-t border-slate-800">
          <div class="flex items-center gap-3">
            <img :src="ch.thumbnail_url" alt="thumb" class="w-10 h-10 rounded-full"/>
            <div class="min-w-0">
              <div class="font-medium truncate" :title="ch.channel_name">{{ ch.channel_name }}</div>
            </div>
          </div>
          <div class="md:text-center">
            <span
              class="text-xs px-2 py-1 rounded-full"
              :class="ch.is_active ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-800 text-slate-300'"
            >
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
    <div class="mt-10 panel-card">
      <div class="px-6 py-4 border-b border-slate-800">
        <div class="text-lg font-semibold">Nowe filmy (ostatnie 3 dni)</div>
      </div>
      <div class="p-6">
        <div v-if="videosPending" class="text-center">Ładowanie…</div>
        <div v-else-if="videosError" class="text-center text-red-500">Błąd ładowania filmów.</div>
        <div v-else>
          <div v-if="recentVideos.length === 0" class="text-sm text-slate-400">Brak nowych filmów w ostatnich 3 dniach.</div>
          <div v-else class="overflow-x-auto">
            <table class="panel-table">
              <thead>
                <tr>
                  <th class="text-left px-4 py-2">Video</th>
                  <th class="text-left px-4 py-2">Kanał</th>
                  <th class="text-left px-4 py-2">Data</th>
                  <th class="text-left px-4 py-2">Napisy</th>
                  <th class="text-left px-4 py-2">AI</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in recentVideos" :key="v.video_id">
                  <td class="px-4 py-2">
                    <a :href="`https://www.youtube.com/watch?v=${v.video_id}`" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">{{ v.title }}</a>
                  </td>
                  <td class="px-4 py-2">{{ v.channel_name }}</td>
                  <td class="px-4 py-2">{{ new Date(v.published_at).toLocaleString('pl-PL') }}</td>
                  <td class="px-4 py-2">
                    <span :class="(v.has_captions ?? v.captions) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">{{ (v.has_captions ?? v.captions) ? '✓' : '—' }}</span>
                  </td>
                  <td class="px-4 py-2">
                    <span :class="(v.has_ai_response ?? v.response) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">{{ (v.has_ai_response ?? v.response) ? '✓' : '—' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- API Usage section -->
    <div class="mt-10 panel-card">
      <div class="px-6 py-4 border-b border-slate-800">
        <div class="text-lg font-semibold">Użycie API YouTube</div>
        <div class="panel-subtitle">Statystyki zapytań API na dobę</div>
      </div>
      <div class="p-6">
        <div v-if="statsPending" class="text-center">Ładowanie…</div>
        <div v-else-if="statsError" class="text-center text-red-500">Błąd ładowania statystyk.</div>
        <div v-else>
          <div class="mb-2 text-sm text-slate-300">Zużyte dzisiaj: <span class="font-semibold">{{ statsData.apiUsage.used }}</span> jednostek</div>
          <div class="mb-2 text-sm text-slate-300">
            Limit dzienny: <span class="font-semibold">{{ statsData.apiQuota.dailyLimit }}</span>,
            pozostało: <span class="font-semibold">{{ statsData.apiQuota.remaining }}</span>
          </div>
          <div class="mb-3">
            <div class="w-full h-2 rounded bg-slate-800 overflow-hidden">
              <div
                class="h-full transition-all"
                :class="statsData.apiQuota.warningLevel === 'critical' ? 'bg-red-500' : statsData.apiQuota.warningLevel === 'warning' ? 'bg-yellow-500' : 'bg-green-500'"
                :style="{ width: `${statsData.apiQuota.usagePercent}%` }"
              />
            </div>
            <div class="mt-1 text-xs" :class="statsData.apiQuota.warningLevel === 'critical' ? 'text-red-400' : statsData.apiQuota.warningLevel === 'warning' ? 'text-yellow-400' : 'text-slate-400'">
              Wykorzystanie quota: {{ statsData.apiQuota.usagePercent }}%
            </div>
          </div>
          <div class="mb-4 text-sm text-slate-400">Szacowane zapytania/dobę (na podstawie aktywnych kanałów): <span class="font-semibold text-slate-200">{{ statsData.apiExpected.totalPerDay }}</span></div>
          <div class="overflow-x-auto">
            <table class="panel-table">
              <thead>
                <tr>
                  <th class="text-left px-4 py-2">Operacja</th>
                  <th class="text-left px-4 py-2">Liczba</th>
                  <th class="text-left px-4 py-2">Koszt</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in statsData.apiUsage.breakdown" :key="row.operation">
                  <td class="px-4 py-2">{{ row.operation }}</td>
                  <td class="px-4 py-2">{{ row.count }}</td>
                  <td class="px-4 py-2">{{ row.cost }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-6">
            <div class="text-sm font-medium mb-2 text-slate-200">Szacun dla kanałów (z interwałów)</div>
            <div class="overflow-x-auto">
              <table class="panel-table">
                <thead>
                  <tr>
                    <th class="text-left px-4 py-2">Kanał</th>
                    <th class="text-left px-4 py-2">Zapytania/dobę</th>
                    <th class="text-left px-4 py-2">Interwał (min)</th>
                    <th class="text-left px-4 py-2">Przedział</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in statsData.apiExpected.breakdown" :key="row.channel_id">
                    <td class="px-4 py-2">{{ row.channel_name }}</td>
                    <td class="px-4 py-2">{{ row.perDay }}</td>
                    <td class="px-4 py-2">{{ Math.round(row.intervalMs / 60000) }}</td>
                    <td class="px-4 py-2">{{ row.window || '24h' }}</td>
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
import { useToast } from '~/composables/useToast';

const {
  data: dashboard,
  pending: dashboardPending,
  error: dashboardError,
  refresh: refreshDashboard,
} = await useFetch('/api/dashboard');

const channelsPending = dashboardPending;
const channelsError = dashboardError;
const videosPending = dashboardPending;
const videosError = dashboardError;
const statsPending = dashboardPending;
const statsError = dashboardError;

const stats = computed(() => {
  const totals = dashboard.value?.totals;
  if (!totals) {
    return {
      totalChannels: 0,
      activeChannels: 0,
      totalVideos: 0,
      totalAI: 0,
    };
  }

  return {
    totalChannels: totals.totalChannels || 0,
    activeChannels: totals.activeChannels || 0,
    totalVideos: totals.totalVideos || 0,
    totalAI: totals.totalAI || 0,
  };
});

const viewMode = ref<'cards' | 'list'>('cards');
const channelsData = computed(() => dashboard.value?.channels || []);
const channelStatsById = computed<Record<string, { videos: number; captions: number; ai: number }>>(
  () => dashboard.value?.channelStats || {}
);
const recentVideos = computed(() => dashboard.value?.recentVideos || []);
const statsData = computed(() => ({
  apiUsage: dashboard.value?.apiUsage || { used: 0, breakdown: [] },
  apiQuota: dashboard.value?.apiQuota || { dailyLimit: 10_000, remaining: 10_000, usagePercent: 0, warningLevel: 'ok' },
  apiExpected: dashboard.value?.apiExpected || { totalPerDay: 0, breakdown: [] },
}));

function countVideosByChannel(channelId: string): number {
  return channelStatsById.value[channelId]?.videos || 0;
}
function countCaptionsByChannel(channelId: string): number {
  return channelStatsById.value[channelId]?.captions || 0;
}
function countAIByChannel(channelId: string): number {
  return channelStatsById.value[channelId]?.ai || 0;
}

const checkInProgress = ref(false);
const toast = useToast();

async function triggerCheckVideos() {
  checkInProgress.value = true;
  try {
    await $fetch('/api/tasks/check-videos', { method: 'POST' });
    toast.success('Uruchomiono sprawdzanie filmów. Odświeżono dashboard.');
    await refreshDashboard();
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
</script>
