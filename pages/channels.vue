<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <h1 class="text-3xl font-bold">Channels</h1>
      <div class="flex items-center gap-2">
        <div class="bg-gray-100 dark:bg-gray-700 rounded p-1 inline-flex">
          <button class="px-3 py-1 rounded text-sm"
                  :class="viewMode === 'cards' ? 'bg-white dark:bg-gray-200 shadow text-gray-800 dark:text-gray-900' : 'text-gray-600 dark:text-gray-300'"
                  @click="viewMode = 'cards'">Karty</button>
          <button class="px-3 py-1 rounded text-sm"
                  :class="viewMode === 'list' ? 'bg-white dark:bg-gray-200 shadow text-gray-800 dark:text-gray-900' : 'text-gray-600 dark:text-gray-300'"
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
      <div v-for="channel in channels" :key="channel.channel_id" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <img :src="channel.thumbnail_url" alt="Channel thumbnail" class="w-16 h-16 rounded-full mr-4">
            <div>
              <h2 class="text-xl font-bold">{{ channel.channel_name }}</h2>
              <p class="text-gray-500 dark:text-gray-400 text-[10px]">{{ channel.channel_id }}</p>
            </div>
          </div>
          <span class="text-xs px-2 py-1 rounded-full"
                :class="channel.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
            {{ channel.is_active ? 'Aktywny' : 'Nieaktywny' }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-4">
          <div class="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center">
            <div class="text-lg font-semibold">{{ countVideosByChannel(channel.channel_id) }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-300">Filmów</div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center">
            <div class="text-lg font-semibold">{{ countCaptionsByChannel(channel.channel_id) }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-300">Napisów</div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 rounded p-3 text-center">
            <div class="text-lg font-semibold">{{ countAIByChannel(channel.channel_id) }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-300">Analiz AI</div>
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
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="hidden md:grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
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
          <div class="mb-4">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" v-model="timeWindowEnabled" />
              Ogranicz sprawdzanie do godzin
            </label>
            <div class="flex gap-2 mt-2">
              <input type="number" min="0" max="23" v-model.number="timeWindowFromHour" :disabled="!timeWindowEnabled" class="w-1/2 px-3 py-2 border rounded-lg disabled:opacity-50" placeholder="Od (0-23)">
              <input type="number" min="0" max="23" v-model.number="timeWindowToHour" :disabled="!timeWindowEnabled" class="w-1/2 px-3 py-2 border rounded-lg disabled:opacity-50" placeholder="Do (0-23)">
            </div>
            <p class="text-xs text-gray-500 mt-1">Przykład: 16 do 22 oznacza sprawdzanie tylko między 16:00 a 22:00.</p>
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showAddChannelModal = false" class="text-gray-600 mr-4">Cancel</button>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-lg">Add Channel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Channel Modal -->
    <div v-if="editing" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <h3 class="text-xl font-semibold mb-4 dark:text-gray-100">Edytuj kanał</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Nazwa</label>
            <input v-model="editing.channel_name" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
          </div>
          <div>
            <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">URL</label>
            <input v-model="editing.channel_url" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"/>
          </div>
          <div>
            <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">Interwał sprawdzania</label>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model.number="editIntervalValue"
                type="number"
                min="1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <select
                v-model="editIntervalUnit"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="ms">ms</option>
                <option value="s">sekundy</option>
                <option value="min">minuty</option>
                <option value="h">godziny</option>
              </select>
            </div>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 pt-3">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" v-model="editTimeWindowEnabled" class="accent-blue-600"/>
              Ogranicz sprawdzanie do godzin
            </label>
            <div class="grid grid-cols-2 gap-2 mt-2">
              <input
                v-model.number="editing.check_from_hour"
                type="number"
                min="0"
                max="23"
                :disabled="!editTimeWindowEnabled"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                placeholder="Od (0-23)"
              />
              <input
                v-model.number="editing.check_to_hour"
                type="number"
                min="0"
                max="23"
                :disabled="!editTimeWindowEnabled"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                placeholder="Do (0-23)"
              />
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Przykład: 16 do 22 oznacza sprawdzanie tylko między 16:00 a 22:00.</p>
          </div>
          <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" v-model="editing.is_active" class="accent-blue-600"/>
            Aktywny
          </label>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="cancelEdit" class="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Anuluj</button>
          <button @click="saveEdit" class="px-4 py-2 rounded bg-blue-600 text-white">Zapisz</button>
        </div>
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
const timeWindowEnabled = ref(false);
const timeWindowFromHour = ref<number>(16);
const timeWindowToHour = ref<number>(22);

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

function viewChannel(channelId: string) {
  const url = `https://youtube.com/channel/${channelId}`;
  window.open(url, '_blank');
}

async function refreshChannelNow(channelId: string) {
  try {
    await $fetch(`/api/channels/${channelId}/check`, { method: 'POST' });
    await refresh();
  } catch {}
}

const editing = ref<any | null>(null);
const editTimeWindowEnabled = ref(false);
const editIntervalValue = ref<number>(30);
const editIntervalUnit = ref<'ms' | 's' | 'min' | 'h'>('min');
function openEdit(channel: any) {
  editing.value = { ...channel };
  const intervalMs = Number(channel?.check_interval || 1800000);
  const interval = splitIntervalMs(intervalMs);
  editIntervalValue.value = interval.value;
  editIntervalUnit.value = interval.unit;
  const from = Number(channel?.check_from_hour);
  const to = Number(channel?.check_to_hour);
  const hasWindow = Number.isInteger(from) && from >= 0 && from <= 23 && Number.isInteger(to) && to >= 0 && to <= 23;
  editTimeWindowEnabled.value = hasWindow;
  editing.value.check_from_hour = hasWindow ? from : 16;
  editing.value.check_to_hour = hasWindow ? to : 22;
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
  const fromHour = timeWindowEnabled.value ? normalizeHour(timeWindowFromHour.value) : null;
  const toHour = timeWindowEnabled.value ? normalizeHour(timeWindowToHour.value) : null;

  await $fetch('/api/channels', {
    method: 'POST',
    body: {
      ...newChannel.value,
      check_interval: checkIntervalMs,
      check_from_hour: fromHour,
      check_to_hour: toHour,
    },
  });
  showAddChannelModal.value = false;
  newChannel.value = { channel_id: '' };
  intervalValue.value = 30;
  intervalUnit.value = 'min';
  timeWindowEnabled.value = false;
  timeWindowFromHour.value = 16;
  timeWindowToHour.value = 22;
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

async function saveEdit() {
  if (!editing.value) return;
  const fromHour = editTimeWindowEnabled.value ? normalizeHour(editing.value.check_from_hour) : null;
  const toHour = editTimeWindowEnabled.value ? normalizeHour(editing.value.check_to_hour) : null;
  const payload: any = {
    channel_name: editing.value.channel_name,
    channel_url: editing.value.channel_url,
    check_interval: convertIntervalToMs(editIntervalValue.value, editIntervalUnit.value),
    check_from_hour: fromHour,
    check_to_hour: toHour,
    is_active: !!editing.value.is_active,
  };
  await $fetch(`/api/channels/${editing.value.channel_id}`, { method: 'PUT', body: payload });
  editing.value = null;
  await refresh();
}

function cancelEdit() {
  editing.value = null;
}

function normalizeHour(raw: unknown): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 23) return 23;
  return Math.floor(value);
}

function convertIntervalToMs(valueRaw: unknown, unit: 'ms' | 's' | 'min' | 'h'): number {
  const value = Math.max(1, Math.floor(Number(valueRaw) || 1));
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'min') return value * 60 * 1000;
  if (unit === 's') return value * 1000;
  return value;
}

function splitIntervalMs(intervalMsRaw: unknown): { value: number; unit: 'ms' | 's' | 'min' | 'h' } {
  const intervalMs = Math.max(1, Math.floor(Number(intervalMsRaw) || 1));
  if (intervalMs % (60 * 60 * 1000) === 0) {
    return { value: intervalMs / (60 * 60 * 1000), unit: 'h' };
  }
  if (intervalMs % (60 * 1000) === 0) {
    return { value: intervalMs / (60 * 1000), unit: 'min' };
  }
  if (intervalMs % 1000 === 0) {
    return { value: intervalMs / 1000, unit: 's' };
  }
  return { value: intervalMs, unit: 'ms' };
}
</script>
