import { db } from '~/server/db';
import { getYoutubeTranscript } from '~/server/utils/turboscribe';
import { analyzeTranscript } from '~/server/utils/openai';

function captionsToTranscript(raw: unknown): string {
  if (!raw) return '';
  if (Array.isArray(raw)) {
    return raw.map((segment: any) => String(segment?.text || '').trim()).filter(Boolean).join(' ').trim();
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((segment: any) => String(segment?.text || '').trim()).filter(Boolean).join(' ').trim();
      }
    } catch {
      // plain text
    }
    return raw.trim();
  }
  return String(raw).trim();
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const action = String(body?.action || '');
  const idsRaw = Array.isArray(body?.videoIds) ? body.videoIds : [];
  const assistantId = typeof body?.assistantId === 'string' ? body.assistantId.trim() : '';

  const videoIds = Array.from(new Set(idsRaw.map((id: any) => String(id || '').trim()).filter(Boolean)));
  if (videoIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'videoIds are required' });
  }
  if (videoIds.length > 50) {
    throw createError({ statusCode: 400, statusMessage: 'Maksymalnie 50 filmów na jedną akcję batch.' });
  }

  if (action !== 'captions' && action !== 'ai') {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported batch action' });
  }
  if (action === 'ai' && !assistantId) {
    throw createError({ statusCode: 400, statusMessage: 'assistantId is required for AI batch action' });
  }

  let processed = 0;
  let updated = 0;
  const failed: Array<{ videoId: string; error: string }> = [];

  for (const videoId of videoIds) {
    processed += 1;
    try {
      if (action === 'captions') {
        const transcript = await getYoutubeTranscript(videoId, 'Polish');
        db.prepare('UPDATE videos SET captions = ? WHERE video_id = ?').run(transcript, videoId);
        updated += 1;
        continue;
      }

      const row = db.prepare('SELECT captions FROM videos WHERE video_id = ?').get(videoId) as { captions?: unknown } | undefined;
      const transcript = captionsToTranscript(row?.captions);
      if (!transcript) {
        failed.push({ videoId, error: 'Brak napisów do analizy AI.' });
        continue;
      }
      const analysis = await analyzeTranscript(transcript, assistantId);
      db.prepare('UPDATE videos SET response = ? WHERE video_id = ?').run(analysis, videoId);
      updated += 1;
    } catch (err: any) {
      failed.push({ videoId, error: err?.message || 'Unknown error' });
    }
  }

  return {
    action,
    processed,
    updated,
    failed,
  };
});
