export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV === 'development') {
    const originalWarn = console.warn;
    // Suppress extremely noisy dev warning coming from Nuxt core about manifest-route-rule
    console.warn = (...args: unknown[]) => {
      const msg = String(args?.[0] ?? '');
      if (msg.includes('manifest-route-rule')) return;
      originalWarn(...args as []);
    };
  }
});


