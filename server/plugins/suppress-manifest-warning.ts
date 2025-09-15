export default defineNitroPlugin(() => {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const msg = String(args?.[0] ?? '');
    if (msg.includes('manifest-route-rule')) return;
    originalWarn(...(args as []));
  };
});


