export default defineNitroPlugin(() => {
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  function shouldSuppress(chunk: unknown): boolean {
    const text = typeof chunk === 'string' ? chunk : (chunk as any)?.toString?.('utf8') ?? '';
    return text.includes("'manifest-route-rule' middleware already exists");
  }

  // Suppress extremely noisy duplicate middleware warnings in dev
  // This filters both stdout and stderr lines emitted by Nuxt/Consola
  // without affecting other warnings/errors.
  // Note: Only applied in development.
  if (process.env.NODE_ENV === 'development') {
    // @ts-expect-error Node typings for write signatures are permissive
    process.stdout.write = (chunk: unknown, encoding?: unknown, cb?: unknown) => {
      if (shouldSuppress(chunk)) return true;
      // @ts-expect-error preserve original signature
      return originalStdoutWrite(chunk, encoding, cb);
    };

    // @ts-expect-error Node typings for write signatures are permissive
    process.stderr.write = (chunk: unknown, encoding?: unknown, cb?: unknown) => {
      if (shouldSuppress(chunk)) return true;
      // @ts-expect-error preserve original signature
      return originalStderrWrite(chunk, encoding, cb);
    };
  }
});


