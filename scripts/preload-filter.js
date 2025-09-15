// Preload filter for stdout/stderr to suppress noisy dev warnings
const origStdout = process.stdout.write.bind(process.stdout);
const origStderr = process.stderr.write.bind(process.stderr);

function shouldSuppress(chunk) {
  try {
    const str = typeof chunk === 'string' ? chunk : (chunk && chunk.toString && chunk.toString('utf8')) || '';
    return str.includes("'manifest-route-rule' middleware already exists");
  } catch {
    return false;
  }
}

if (process.env.NODE_ENV !== 'production') {
  process.stdout.write = function (chunk, encoding, cb) {
    if (shouldSuppress(chunk)) return true;
    return origStdout(chunk, encoding, cb);
  };
  process.stderr.write = function (chunk, encoding, cb) {
    if (shouldSuppress(chunk)) return true;
    return origStderr(chunk, encoding, cb);
  };
}


