export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore registration errors; push stays optional.
    });
  });
});
