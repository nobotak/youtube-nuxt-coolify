<template>
  <div>
    <h1 class="text-3xl font-bold mb-6 text-slate-100">Settings</h1>

    <div class="panel-card p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 text-slate-100">Database backup</h2>
      <p class="panel-subtitle mb-4">Pobierz bieżący plik bazy SQLite.</p>
      <a :href="'/api/settings/backup'" class="panel-btn-primary">Pobierz backup</a>
    </div>

    <div class="panel-card p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 text-slate-100">Auto new videos checking</h2>
      <label class="inline-flex items-center gap-2 text-slate-300">
        <input type="checkbox" v-model="autoCheckEnabled" class="accent-blue-600" />
        Włącz automatyczne sprawdzanie nowych filmów
      </label>
      <div class="mt-3">
        <button
          @click="saveAutoCheckSetting"
          :disabled="autoCheckSaving"
          class="panel-btn-primary"
        >
          {{ autoCheckSaving ? 'Zapisywanie...' : 'Zapisz ustawienie' }}
        </button>
        <span v-if="autoCheckMessage" class="ml-3 text-sm" :class="autoCheckSuccess ? 'text-emerald-300' : 'text-red-300'">
          {{ autoCheckMessage }}
        </span>
      </div>
      <p class="mt-2 text-xs text-slate-400">
        Scheduler uruchamia się co minutę i sprawdza tylko kanały aktywne, które przekroczyły swój interwał i mieszczą się w przedziale godzinowym.
      </p>
    </div>

    <div class="panel-card p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 text-slate-100">Database restore</h2>
      <p class="panel-subtitle mb-4">Wgraj plik .db aby podmienić bieżącą bazę (aplikacja automatycznie przełączy połączenie).</p>
      <form @submit.prevent="onUpload">
        <input ref="fileInput" type="file" accept=".db" class="panel-input mb-4" />
        <div class="flex items-center gap-3">
          <button type="submit" class="panel-btn bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60" :disabled="uploading">
            <span v-if="!uploading">Wgraj bazę</span>
            <span v-else class="inline-flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Wgrywanie...
            </span>
          </button>
          <span v-if="message" class="text-sm" :class="success ? 'text-emerald-300' : 'text-red-300'">{{ message }}</span>
        </div>
        <div v-if="uploading" class="mt-3 text-xs text-slate-400">
          {{ progressText }}
        </div>
      </form>
    </div>

    <!-- Logs -->
    <div class="panel-card p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-slate-100">Logs</h2>
        <button @click="refreshLogs" class="panel-btn-secondary">Odśwież</button>
      </div>
      <div v-if="logsPending" class="space-y-3">
        <div v-for="i in 6" :key="`logs-skel-${i}`" class="grid grid-cols-3 gap-3">
          <div class="skeleton-line h-4" />
          <div class="skeleton-line h-4" />
          <div class="skeleton-line h-4" />
        </div>
      </div>
      <div v-else>
        <div v-if="logs.length === 0" class="empty-state">
          <div class="empty-state-title">Brak logow</div>
          <div class="empty-state-subtitle">Logi pojawia sie po pierwszych akcjach w aplikacji.</div>
        </div>
        <div v-else class="overflow-auto max-h-[55vh]">
          <table class="panel-table panel-table-sticky">
            <thead>
              <tr>
                <th class="text-left px-4 py-2">Czas</th>
                <th class="text-left px-4 py-2">Akcja</th>
                <th class="text-left px-4 py-2">Szczegóły</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in logs" :key="row.id">
                <td class="px-4 py-2">{{ new Date(row.created_at).toLocaleString('pl-PL') }}</td>
                <td class="px-4 py-2">{{ row.action }}</td>
                <td class="px-4 py-2 whitespace-pre-wrap">{{ row.details }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  </template>

<script setup lang="ts">
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const message = ref('')
const success = ref(false)
const progressText = ref('')
const MAX_UPLOAD_MB = 25
const { data: logsData, pending: logsPending, refresh: refreshLogs } = await useFetch('/api/logs?limit=20')
const { data: autoCheckData, refresh: refreshAutoCheck } = await useFetch('/api/settings/auto-check')
const logs = computed(() => logsData.value || [])
const toast = useToast()
const autoCheckEnabled = ref(false)
const autoCheckSaving = ref(false)
const autoCheckMessage = ref('')
const autoCheckSuccess = ref(false)

watchEffect(() => {
  autoCheckEnabled.value = !!autoCheckData.value?.enabled
})

async function onUpload() {
  if (!fileInput.value || !fileInput.value.files || fileInput.value.files.length === 0) {
    message.value = 'Wybierz plik .db';
    success.value = false;
    return;
  }
  const file = fileInput.value.files[0]
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!['db', 'sqlite', 'sqlite3'].includes(ext)) {
    message.value = 'Dozwolone są tylko pliki .db/.sqlite/.sqlite3'
    success.value = false
    return
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    message.value = `Plik jest za duży (max ${MAX_UPLOAD_MB} MB)`
    success.value = false
    return
  }
  const form = new FormData()
  form.append('file', file)

  uploading.value = true
  message.value = ''
  try {
    console.log('[settings] Starting upload...')
    progressText.value = 'Wysyłanie pliku...'
    const res = await $fetch('/api/settings/upload', { method: 'POST', body: form })
    console.log('[settings] Upload response:', res)
    success.value = true
    message.value = 'Baza została podmieniona. Odśwież widok.'
    toast.success('Baza została podmieniona. Odśwież widok.')
  } catch (e: any) {
    console.error('[settings] Upload failed:', e)
    success.value = false
    message.value = e?.data?.statusMessage || 'Błąd podczas wgrywania bazy'
    toast.error(message.value)
  } finally {
    uploading.value = false
    progressText.value = ''
  }
}

async function saveAutoCheckSetting() {
  autoCheckSaving.value = true
  autoCheckMessage.value = ''
  try {
    await $fetch('/api/settings/auto-check', {
      method: 'PUT',
      body: { enabled: autoCheckEnabled.value },
    })
    await refreshAutoCheck()
    autoCheckSuccess.value = true
    autoCheckMessage.value = 'Zapisano ustawienie.'
    toast.success('Zapisano ustawienie auto-check.')
  } catch (e: any) {
    autoCheckSuccess.value = false
    autoCheckMessage.value = e?.data?.statusMessage || 'Nie udało się zapisać ustawienia.'
    toast.error(autoCheckMessage.value)
  } finally {
    autoCheckSaving.value = false
  }
}
</script>


