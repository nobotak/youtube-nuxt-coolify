<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Settings</h1>

    <div class="bg-white p-6 rounded-lg shadow mb-8">
      <h2 class="text-xl font-semibold mb-4">Database backup</h2>
      <p class="text-gray-600 mb-4">Pobierz bieżący plik bazy SQLite.</p>
      <a :href="'/api/settings/backup'" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Pobierz backup</a>
    </div>

    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-xl font-semibold mb-4">Database restore</h2>
      <p class="text-gray-600 mb-4">Wgraj plik .db aby podmienić bieżącą bazę (aplikacja automatycznie przełączy połączenie).</p>
      <form @submit.prevent="onUpload">
        <input ref="fileInput" type="file" accept=".db" class="mb-4" />
        <div class="flex items-center gap-3">
          <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60" :disabled="uploading">
            <span v-if="!uploading">Wgraj bazę</span>
            <span v-else class="inline-flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Wgrywanie...
            </span>
          </button>
          <span v-if="message" class="text-sm" :class="success ? 'text-green-700' : 'text-red-700'">{{ message }}</span>
        </div>
        <div v-if="uploading" class="mt-3 text-xs text-gray-500">
          {{ progressText }}
        </div>
      </form>
    </div>
  </div>
  </template>

<script setup lang="ts">
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const message = ref('')
const success = ref(false)
const progressText = ref('')

async function onUpload() {
  if (!fileInput.value || !fileInput.value.files || fileInput.value.files.length === 0) {
    message.value = 'Wybierz plik .db';
    success.value = false;
    return;
  }
  const file = fileInput.value.files[0]
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
  } catch (e: any) {
    console.error('[settings] Upload failed:', e)
    success.value = false
    message.value = e?.data?.statusMessage || 'Błąd podczas wgrywania bazy'
  } finally {
    uploading.value = false
    progressText.value = ''
  }
}
</script>


