<template>
  <div class="fixed top-4 right-4 z-[100] space-y-2 w-[min(92vw,420px)]">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="rounded-lg border shadow-lg px-4 py-3 text-sm flex items-start justify-between gap-3"
      :class="toastClass(toast.type)"
    >
      <div class="whitespace-pre-wrap">{{ toast.message }}</div>
      <button class="text-xs opacity-80 hover:opacity-100" @click="removeToast(toast.id)">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { toasts, removeToast } = useToast();

function toastClass(type: 'success' | 'error' | 'info') {
  if (type === 'success') {
    return 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200';
  }
  if (type === 'error') {
    return 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200';
  }
  return 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200';
}
</script>
