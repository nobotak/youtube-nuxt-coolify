<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <h1 class="text-3xl font-bold text-slate-100">Channels</h1>
      <div class="flex items-center gap-2">
        <div class="bg-slate-800 rounded p-1 inline-flex">
          <button class="px-3 py-1 rounded text-sm"
                  :class="viewMode === 'cards' ? 'bg-slate-700 shadow text-white' : 'text-slate-400'"
                  @click="viewMode = 'cards'">Karty</button>
          <button class="px-3 py-1 rounded text-sm"
                  :class="viewMode === 'list' ? 'bg-slate-700 shadow text-white' : 'text-slate-400'"
                  @click="viewMode = 'list'">Lista</button>
        </div>
        <button @click="showAddChannelModal = true" class="panel-btn-primary">
          + Add Channel
        </button>
      </div>
    </div>

    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="`channels-skel-${i}`" class="panel-card p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-16 h-16 rounded-full bg-slate-800 animate-pulse" />
          <div class="flex-1 space-y-2">
            <div class="skeleton-line-lg w-40" />
            <div class="skeleton-line w-28" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div class="panel-card-soft p-3"><div class="skeleton-line h-6" /></div>
          <div class="panel-card-soft p-3"><div class="skeleton-line h-6" /></div>
          <div class="panel-card-soft p-3"><div class="skeleton-line h-6" /></div>
        </div>
      </div>
    </div>
    <div v-else-if="error" class="text-center text-red-500">Error loading channels.</div>
    <div v-else-if="!channels || channels.length === 0" class="empty-state">
      <div class="empty-state-title">Brak kanalow</div>
      <div class="empty-state-subtitle">Dodaj pierwszy kanal YouTube, aby rozpoczac monitoring.</div>
    </div>
    <template v-else>
      <div class="mb-4 flex flex-wrap gap-2">
        <button class="stat-chip" :class="{ 'stat-chip-active': statusFilter === 'all' }" @click="statusFilter = 'all'">Wszystkie: {{ totalChannels }}</button>
        <button class="stat-chip" :class="{ 'stat-chip-active': statusFilter === 'active' }" @click="statusFilter = 'active'">Aktywne: {{ activeChannels }}</button>
        <button class="stat-chip" :class="{ 'stat-chip-active': statusFilter === 'inactive' }" @click="statusFilter = 'inactive'">Nieaktywne: {{ inactiveChannels }}</button>
        <span class="stat-chip">Z oknem godzinowym: {{ channelsWithWindow }}</span>
        <span class="stat-chip">Bez okna: {{ channelsWithoutWindow }}</span>
      </div>

      <div v-if="visibleChannels.length === 0" class="empty-state">
        <div class="empty-state-title">Brak kanalow dla wybranego filtra</div>
        <div class="empty-state-subtitle">Zmien filtr statusu, aby zobaczyc pozostale kanaly.</div>
      </div>

      <!-- Cards view -->
      <div v-else-if="viewMode === 'cards'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="channel in visibleChannels" :key="channel.channel_id" class="panel-card p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <img :src="channel.thumbnail_url" alt="Channel thumbnail" class="w-16 h-16 rounded-full mr-4">
            <div>
              <h2 class="text-xl font-bold">{{ channel.channel_name }}</h2>
              <p class="text-slate-400 text-[10px]">{{ channel.channel_id }}</p>
            </div>
          </div>
          <span class="text-xs px-2 py-1 rounded-full"
                :class="channel.is_active ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-800 text-slate-300'">
            {{ channel.is_active ? 'Aktywny' : 'Nieaktywny' }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-4">
          <div class="panel-card-soft p-3 text-center">
            <div class="text-lg font-semibold">{{ countVideosByChannel(channel.channel_id) }}</div>
            <div class="text-xs text-slate-400">Filmów</div>
          </div>
          <div class="panel-card-soft p-3 text-center">
            <div class="text-lg font-semibold">{{ countCaptionsByChannel(channel.channel_id) }}</div>
            <div class="text-xs text-slate-400">Napisów</div>
          </div>
          <div class="panel-card-soft p-3 text-center">
            <div class="text-lg font-semibold">{{ countAIByChannel(channel.channel_id) }}</div>
            <div class="text-xs text-slate-400">Analiz AI</div>
          </div>
        </div>

        <div class="mt-4 flex items-center justify-between pt-3 border-t border-slate-800">
          <div class="text-xs text-slate-400">
            Aktualizacja: {{ formatDateTime(channel.last_check) }}
            <div class="mt-1">Następne: {{ formatDateTime(getNextCheckAt(channel)) }}</div>
          </div>
          <div class="flex items-center gap-2 text-slate-400">
            <button @click="viewChannel(channel.channel_id)" class="hover:text-slate-200" title="Podgląd">
              <span class="material-symbols-outlined text-base">visibility</span>
            </button>
            <button @click="refreshChannelNow(channel.channel_id)" class="hover:text-slate-200" title="Refresh">
              <span class="material-symbols-outlined text-base">refresh</span>
            </button>
            <button @click="openEdit(channel)" class="hover:text-slate-200" title="Edytuj">
              <span class="material-symbols-outlined text-base">edit</span>
            </button>
            <button @click="confirmRemove(channel)" class="text-red-400 hover:text-red-300" title="Usuń">
              <span class="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        </div>
        </div>
      </div>

      <!-- List view -->
      <div v-else class="panel-card overflow-hidden">
        <div class="hidden md:grid grid-cols-6 gap-4 px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide sticky top-0 z-10 bg-slate-900/95 backdrop-blur">
          <div>Kanał</div>
          <div>Status</div>
          <div>Filmów</div>
          <div>Napisy</div>
          <div>Następne</div>
          <div>Akcje</div>
        </div>
        <div v-for="channel in visibleChannels" :key="channel.channel_id" class="grid grid-cols-1 md:grid-cols-6 gap-4 px-6 py-4 border-t border-slate-800">
          <div class="flex items-center gap-3">
            <img :src="channel.thumbnail_url" alt="thumb" class="w-10 h-10 rounded-full"/>
            <div class="min-w-0">
              <div class="font-medium truncate" :title="channel.channel_name">{{ channel.channel_name }}</div>
              <div class="text-slate-400 text-xs truncate" :title="channel.channel_id">{{ channel.channel_id }}</div>
            </div>
          </div>
          <div class="md:text-center">
            <span class="text-xs px-2 py-1 rounded-full"
                  :class="channel.is_active ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-800 text-slate-300'">
              {{ channel.is_active ? 'Aktywny' : 'Nieaktywny' }}
            </span>
          </div>
          <div class="md:text-center text-sm">{{ countVideosByChannel(channel.channel_id) }}</div>
          <div class="md:text-center text-sm">{{ countCaptionsByChannel(channel.channel_id) }}</div>
          <div class="md:text-center text-sm text-slate-300">{{ formatDateTime(getNextCheckAt(channel)) }}</div>
          <div class="md:text-center flex items-center gap-3 text-slate-400">
            <button @click="viewChannel(channel.channel_id)" class="hover:text-slate-200" title="Podgląd">
              <span class="material-symbols-outlined text-base">visibility</span>
            </button>
            <button @click="refreshChannelNow(channel.channel_id)" class="hover:text-slate-200" title="Refresh">
              <span class="material-symbols-outlined text-base">refresh</span>
            </button>
            <button @click="openEdit(channel)" class="hover:text-slate-200" title="Edytuj">
              <span class="material-symbols-outlined text-base">edit</span>
            </button>
            <button @click="confirmRemove(channel)" class="text-red-400 hover:text-red-300" title="Usuń">
              <span class="material-symbols-outlined text-base">delete</span>
            </button>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Add Channel Modal -->
    <div v-if="showAddChannelModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div class="panel-card p-8 w-full max-w-xl">
        <h2 class="text-2xl font-bold mb-4 text-slate-100">Add New Channel</h2>
        <form @submit.prevent="addChannel">
          <div class="mb-4">
            <label for="channel_id" class="block text-slate-300">Channel ID or URL</label>
            <input type="text" v-model="newChannel.channel_id" id="channel_id" class="panel-input mt-1" required>
          </div>
          <div class="mb-4">
            <label class="block text-slate-300">Interwał sprawdzania</label>
            <div class="flex gap-2">
              <input type="number" min="5" v-model.number="intervalValue" class="panel-input w-1/2">
              <select v-model="intervalUnit" class="panel-input w-1/2">
                <option value="min">minut</option>
                <option value="h">godzin</option>
                <option value="d">dni</option>
              </select>
            </div>
          </div>
          <div class="mb-4">
            <label class="inline-flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" v-model="timeWindowEnabled" />
              Ogranicz sprawdzanie do godzin
            </label>
            <div class="flex gap-2 mt-2">
              <input type="number" min="0" max="23" v-model.number="timeWindowFromHour" :disabled="!timeWindowEnabled" class="panel-input w-1/2 disabled:opacity-50" placeholder="Od (0-23)">
              <input type="number" min="0" max="23" v-model.number="timeWindowToHour" :disabled="!timeWindowEnabled" class="panel-input w-1/2 disabled:opacity-50" placeholder="Do (0-23)">
            </div>
            <p class="text-xs text-slate-400 mt-1">Przykład: 16 do 22 oznacza sprawdzanie tylko między 16:00 a 22:00.</p>
          </div>
          <div class="flex justify-end">
            <button type="button" @click="showAddChannelModal = false" class="panel-btn-secondary mr-2">Cancel</button>
            <button type="submit" class="panel-btn-primary">Add Channel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Channel Modal -->
    <div v-if="editing" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="panel-card p-6 w-full max-w-lg">
        <h3 class="text-xl font-semibold mb-4 text-slate-100">Edytuj kanał</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-slate-300 mb-1">Nazwa</label>
            <input v-model="editing.channel_name" class="panel-input"/>
          </div>
          <div>
            <label class="block text-sm text-slate-300 mb-1">URL</label>
            <input v-model="editing.channel_url" class="panel-input"/>
          </div>
          <div>
            <label class="block text-sm text-slate-300 mb-1">Interwał sprawdzania</label>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model.number="editIntervalValue"
                type="number"
                min="1"
                class="panel-input"
              />
              <select
                v-model="editIntervalUnit"
                class="panel-input"
              >
                <option value="ms">ms</option>
                <option value="s">sekundy</option>
                <option value="min">minuty</option>
                <option value="h">godziny</option>
              </select>
            </div>
          </div>
          <div class="border-t border-slate-800 pt-3">
            <label class="inline-flex items-center gap-2 text-sm text-slate-300">
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
                class="panel-input disabled:opacity-50"
                placeholder="Od (0-23)"
              />
              <input
                v-model.number="editing.check_to_hour"
                type="number"
                min="0"
                max="23"
                :disabled="!editTimeWindowEnabled"
                class="panel-input disabled:opacity-50"
                placeholder="Do (0-23)"
              />
            </div>
            <p class="text-xs text-slate-400 mt-1">Przykład: 16 do 22 oznacza sprawdzanie tylko między 16:00 a 22:00.</p>
          </div>
          <label class="inline-flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" v-model="editing.is_active" class="accent-blue-600"/>
            Aktywny
          </label>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button @click="cancelEdit" class="panel-btn-secondary">Anuluj</button>
          <button @click="saveEdit" class="panel-btn-primary">Zapisz</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: channels, pending, error, refresh } = await useFetch('/api/channels');
const { data: videos } = await useFetch('/api/videos');
const toast = useToast();

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
const statusFilter = ref<'all' | 'active' | 'inactive'>('all');
const totalChannels = computed(() => (channels.value || []).length);
const activeChannels = computed(() => (channels.value || []).filter((c: any) => !!c?.is_active).length);
const inactiveChannels = computed(() => Math.max(0, totalChannels.value - activeChannels.value));
const channelsWithWindow = computed(() => (channels.value || []).filter((c: any) => Number.isInteger(Number(c?.check_from_hour)) && Number.isInteger(Number(c?.check_to_hour))).length);
const channelsWithoutWindow = computed(() => Math.max(0, totalChannels.value - channelsWithWindow.value));
const visibleChannels = computed<any[]>(() => {
  const list = (channels.value || []) as any[];
  if (statusFilter.value === 'active') return list.filter((c: any) => !!c?.is_active);
  if (statusFilter.value === 'inactive') return list.filter((c: any) => !c?.is_active);
  return list;
});

const CHANNELS_UI_STORAGE_KEY = 'channels-ui-v1';

function loadSavedUiState() {
  if (!process.client) return;
  try {
    const raw = localStorage.getItem(CHANNELS_UI_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { viewMode?: 'cards' | 'list'; statusFilter?: 'all' | 'active' | 'inactive' };
    if (parsed.viewMode === 'cards' || parsed.viewMode === 'list') viewMode.value = parsed.viewMode;
    if (parsed.statusFilter === 'all' || parsed.statusFilter === 'active' || parsed.statusFilter === 'inactive') statusFilter.value = parsed.statusFilter;
  } catch {
    // Ignore localStorage parse errors.
  }
}

function saveUiState() {
  if (!process.client) return;
  try {
    localStorage.setItem(CHANNELS_UI_STORAGE_KEY, JSON.stringify({ viewMode: viewMode.value, statusFilter: statusFilter.value }));
  } catch {
    // Ignore localStorage write errors.
  }
}

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

function getNextCheckAt(channel: any): string | undefined {
  if (!channel?.is_active) return undefined;
  const intervalMs = Math.max(1, Number(channel?.check_interval || 1800000));
  const nowMs = Date.now();
  const lastCheckMs = new Date(channel?.last_check || 0).getTime();
  let nextMs = Number.isFinite(lastCheckMs) && lastCheckMs > 0 ? (lastCheckMs + intervalMs) : nowMs;
  if (nextMs < nowMs) nextMs = nowMs;
  nextMs = alignToWindow(nextMs, channel?.check_from_hour, channel?.check_to_hour);
  return new Date(nextMs).toISOString();
}

function alignToWindow(ts: number, fromRaw: unknown, toRaw: unknown): number {
  const from = Number(fromRaw);
  const to = Number(toRaw);
  const hasFrom = Number.isInteger(from) && from >= 0 && from <= 23;
  const hasTo = Number.isInteger(to) && to >= 0 && to <= 23;
  if (!hasFrom || !hasTo || from === to) return ts;

  const isWithin = (d: Date) => {
    const h = d.getHours();
    if (from < to) return h >= from && h < to;
    return h >= from || h < to;
  };

  const base = new Date(ts);
  if (isWithin(base)) return ts;

  for (let dayOffset = 0; dayOffset <= 2; dayOffset += 1) {
    const candidate = new Date(base);
    candidate.setDate(base.getDate() + dayOffset);
    candidate.setHours(from, 0, 0, 0);
    if (candidate.getTime() >= ts) return candidate.getTime();
  }
  return ts;
}

function viewChannel(channelId: string) {
  const url = `https://youtube.com/channel/${channelId}`;
  window.open(url, '_blank');
}

async function refreshChannelNow(channelId: string) {
  try {
    await $fetch(`/api/channels/${channelId}/check`, { method: 'POST' });
    await refresh();
    toast.success('Uruchomiono sprawdzanie kanału.');
  } catch {
    toast.error('Nie udało się uruchomić sprawdzania kanału.');
  }
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

  try {
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
    await refresh();
    toast.success('Kanał został zapisany.');
  } catch (err: any) {
    toast.error(err?.statusMessage || err?.message || 'Nie udało się dodać kanału.');
  }
}

async function deleteChannel(channelId: string) {
    if (confirm('Are you sure you want to delete this channel?')) {
        try {
          await $fetch(`/api/channels/${channelId}`, {
              method: 'DELETE',
          });
          await refresh();
          toast.success('Kanał został usunięty.');
        } catch (err: any) {
          toast.error(err?.statusMessage || err?.message || 'Nie udało się usunąć kanału.');
        }
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
  try {
    await $fetch(`/api/channels/${editing.value.channel_id}`, { method: 'PUT', body: payload });
    editing.value = null;
    await refresh();
    toast.success('Zapisano zmiany kanału.');
  } catch (err: any) {
    toast.error(err?.statusMessage || err?.message || 'Nie udało się zapisać zmian.');
  }
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

onMounted(() => {
  loadSavedUiState();
});

watch([viewMode, statusFilter], saveUiState, { immediate: false });
</script>
