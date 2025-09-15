import { addRouteMiddleware } from '#app';

export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV === 'development') {
    try {
      // Replace noisy built-in middleware with a noop to avoid duplicate registration warnings
      addRouteMiddleware('manifest-route-rule', () => {}, { override: true });
    } catch {}
  }
});


