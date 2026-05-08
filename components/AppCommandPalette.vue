<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[120] bg-black/60 p-4 md:p-10"
    @click.self="$emit('close')"
  >
    <div class="mx-auto w-full max-w-2xl panel-card p-3">
      <div class="mb-3">
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          class="panel-input"
          placeholder="Szukaj akcji... (np. videos, settings, density)"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="runActive()"
          @keydown.esc.prevent="$emit('close')"
        />
      </div>

      <div class="max-h-[60vh] overflow-auto">
        <button
          v-for="(action, idx) in filteredActions"
          :key="action.id"
          class="w-full rounded-lg px-3 py-2 text-left transition-colors"
          :class="idx === activeIndex ? 'bg-slate-800 text-slate-100' : 'text-slate-300 hover:bg-slate-800/70'"
          @mouseenter="activeIndex = idx"
          @click="runAction(action)"
        >
          <div class="text-sm font-medium">{{ action.label }}</div>
          <div class="text-xs text-slate-400 mt-0.5">{{ action.hint }}</div>
        </button>

        <div v-if="filteredActions.length === 0" class="empty-state">
          <div class="empty-state-title">Brak dopasowanych akcji</div>
          <div class="empty-state-subtitle">Sprobuj innej frazy, np. "videos", "settings", "density".</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommandPaletteAction } from '~/composables/useCommandPaletteActions';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const query = ref('');
const activeIndex = ref(0);
const router = useRouter();
const route = useRoute();
const { tableDensity, toggleTableDensity } = useUiPrefs();
const { contextualActions } = useCommandPaletteActions();

const baseActions = computed<CommandPaletteAction[]>(() => [
  {
    id: 'go-dashboard',
    label: 'Przejdz do Dashboard',
    hint: 'Nawigacja',
    keywords: 'dashboard home start',
    run: () => router.push('/'),
  },
  {
    id: 'go-channels',
    label: 'Przejdz do Channels',
    hint: 'Nawigacja',
    keywords: 'channels kanal kanaly',
    run: () => router.push('/channels'),
  },
  {
    id: 'go-videos',
    label: 'Przejdz do Videos',
    hint: 'Nawigacja',
    keywords: 'videos filmy',
    run: () => router.push('/videos'),
  },
  {
    id: 'go-captions',
    label: 'Przejdz do Napisy',
    hint: 'Nawigacja',
    keywords: 'captions napisy transkrypt',
    run: () => router.push('/captions'),
  },
  {
    id: 'go-settings',
    label: 'Przejdz do Settings',
    hint: 'Nawigacja',
    keywords: 'settings ustawienia',
    run: () => router.push('/settings'),
  },
  {
    id: 'toggle-density',
    label: `Przelacz gestosc tabel (${tableDensity.value === 'compact' ? 'aktualnie: kompaktowa' : 'aktualnie: wygodna'})`,
    hint: 'UI',
    keywords: 'density compact comfortable tabela gestosc',
    run: () => toggleTableDensity(),
  },
  {
    id: 'refresh-page',
    label: 'Odswiez aktualna strone',
    hint: `Biezaca trasa: ${route.path}`,
    keywords: 'refresh reload odswiez',
    run: () => window.location.reload(),
  },
]);

const actions = computed<CommandPaletteAction[]>(() => [
  ...baseActions.value,
  ...contextualActions.value,
]);

const filteredActions = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return actions.value;
  return actions.value.filter((action) => {
    const text = `${action.label} ${action.hint} ${action.keywords}`.toLowerCase();
    return text.includes(term);
  });
});

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    query.value = '';
    activeIndex.value = 0;
    await nextTick();
    inputRef.value?.focus();
  }
);

watch(filteredActions, () => {
  if (activeIndex.value >= filteredActions.value.length) {
    activeIndex.value = Math.max(0, filteredActions.value.length - 1);
  }
});

function move(delta: number) {
  const total = filteredActions.value.length;
  if (total === 0) return;
  const next = (activeIndex.value + delta + total) % total;
  activeIndex.value = next;
}

function runAction(action: PaletteAction) {
  action.run();
  emit('close');
}

function runActive() {
  const action = filteredActions.value[activeIndex.value];
  if (!action) return;
  runAction(action);
}
</script>
