<template>
  <div class="flex h-screen bg-slate-950 text-slate-100">
    <aside class="w-72 border-r border-slate-800 bg-slate-900/70 flex-shrink-0 backdrop-blur">
      <div class="px-5 py-6 border-b border-slate-800">
        <div class="text-xs uppercase tracking-widest text-slate-500 font-semibold">YouTube Ops</div>
        <h1 class="mt-1 text-lg font-semibold text-slate-100">YT Manager</h1>
      </div>
      <nav class="px-3 py-4">
        <ul class="space-y-1">
          <li>
            <NuxtLink to="/" class="sidebar-link">
              <span>📊</span>
              Dashboard
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/channels" class="sidebar-link">
              <span>📺</span>
              Channels
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/videos" class="sidebar-link">
              <span>🎬</span>
              Videos
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/captions" class="sidebar-link">
                <span>📝</span>
                Napisy
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/settings" class="sidebar-link">
              <span>⚙️</span>
              Settings
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>

    <main class="flex-1 overflow-y-auto">
      <div class="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="text-xs uppercase tracking-widest text-slate-500">Search Console Style Dark UI</div>
            <div class="text-[11px] text-slate-500 mt-1">Skrot: g + d/c/v/n/s (dashboard/channels/videos/napisy/settings)</div>
          </div>
          <button class="panel-btn-secondary" @click="toggleTableDensity">
            Tabela: {{ tableDensity === 'compact' ? 'Kompaktowa' : 'Wygodna' }}
          </button>
        </div>
      </div>
      <div class="p-6">
        <slot />
      </div>
    </main>
    <AppToastStack />
  </div>
</template>

<script setup lang="ts">
const { tableDensity, toggleTableDensity } = useUiPrefs();
const router = useRouter();
const awaitingGoCombo = ref(false);
let comboTimeout: ReturnType<typeof setTimeout> | null = null;

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  return false;
}

function resetGoCombo() {
  awaitingGoCombo.value = false;
  if (comboTimeout) {
    clearTimeout(comboTimeout);
    comboTimeout = null;
  }
}

function armGoCombo() {
  awaitingGoCombo.value = true;
  if (comboTimeout) clearTimeout(comboTimeout);
  comboTimeout = setTimeout(() => {
    awaitingGoCombo.value = false;
    comboTimeout = null;
  }, 1200);
}

function handleGlobalShortcuts(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (isTypingTarget(event.target)) return;

  const key = event.key.toLowerCase();
  if (key === 'g') {
    event.preventDefault();
    armGoCombo();
    return;
  }

  if (!awaitingGoCombo.value) return;

  const routeMap: Record<string, string> = {
    d: '/',
    c: '/channels',
    v: '/videos',
    n: '/captions',
    s: '/settings',
  };

  const targetRoute = routeMap[key];
  if (!targetRoute) return;

  event.preventDefault();
  resetGoCombo();
  router.push(targetRoute);
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalShortcuts);
});

onBeforeUnmount(() => {
  resetGoCombo();
  window.removeEventListener('keydown', handleGlobalShortcuts);
});
</script>
