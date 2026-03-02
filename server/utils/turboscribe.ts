const DEFAULT_LANGUAGE = 'Polish';
const MAX_ATTEMPTS = 120;
const POLL_INTERVAL_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getConfig() {
  const apiBase = (process.env.TURBOSCRIBE_API_BASE || '').trim().replace(/\/+$/, '');
  const apiToken = (process.env.TURBOSCRIBE_API_TOKEN || '').trim();

  if (!apiBase) {
    throw new Error('Missing TURBOSCRIBE_API_BASE.');
  }
  if (!apiToken) {
    throw new Error('Missing TURBOSCRIBE_API_TOKEN.');
  }

  return { apiBase, apiToken };
}

export async function getYoutubeTranscript(videoId: string, language = DEFAULT_LANGUAGE): Promise<string> {
  const { apiBase, apiToken } = getConfig();
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const start = await fetch(`${apiBase}/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-token': apiToken,
    },
    body: JSON.stringify({ youtubeUrl, language }),
  });

  if (!start.ok) {
    throw new Error(`Start failed: ${start.status} ${await start.text()}`);
  }

  const startData = (await start.json()) as { taskId?: string };
  const taskId = startData?.taskId;
  if (!taskId) {
    throw new Error('Brak taskId w odpowiedzi /transcribe');
  }

  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    await sleep(POLL_INTERVAL_MS);

    const statusRes = await fetch(`${apiBase}/status/${taskId}`, {
      headers: { 'x-api-token': apiToken },
    });

    if (!statusRes.ok) {
      throw new Error(`Status failed: ${statusRes.status} ${await statusRes.text()}`);
    }

    const data = (await statusRes.json()) as { status?: string; transcript?: string };
    if (data?.status === 'completed') {
      return data.transcript || '';
    }
    if (data?.status === 'failed' || data?.status === 'cancelled') {
      throw new Error(`Transkrypcja nieudana: ${data.status}`);
    }
  }

  throw new Error('Timeout oczekiwania na transkrypcję');
}
