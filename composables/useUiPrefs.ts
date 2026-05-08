export type TableDensity = 'comfortable' | 'compact';

const STORAGE_KEY = 'ui-prefs-v1';

function isTableDensity(value: unknown): value is TableDensity {
  return value === 'comfortable' || value === 'compact';
}

export function useUiPrefs() {
  const tableDensity = useState<TableDensity>('ui-table-density', () => 'comfortable');
  const hydrated = useState<boolean>('ui-prefs-hydrated', () => false);

  function applyDensityToDom() {
    if (!process.client) return;
    document.documentElement.dataset.tableDensity = tableDensity.value;
  }

  function setTableDensity(next: TableDensity) {
    tableDensity.value = next;
  }

  function toggleTableDensity() {
    tableDensity.value = tableDensity.value === 'comfortable' ? 'compact' : 'comfortable';
  }

  onMounted(() => {
    if (hydrated.value) {
      applyDensityToDom();
      return;
    }

    hydrated.value = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { tableDensity?: unknown };
        if (isTableDensity(parsed?.tableDensity)) {
          tableDensity.value = parsed.tableDensity;
        }
      }
    } catch {
      // Ignore corrupted localStorage payload.
    }

    applyDensityToDom();
  });

  if (process.client) {
    watch(
      tableDensity,
      () => {
        applyDensityToDom();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ tableDensity: tableDensity.value }));
        } catch {
          // Ignore localStorage write errors.
        }
      },
      { immediate: false }
    );
  }

  return {
    tableDensity,
    setTableDensity,
    toggleTableDensity,
  };
}
