import { db } from '~/server/db';

export default defineEventHandler(async (event) => {
  const videoId = event.context.params?.videoId;
  if (!videoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Video ID is required',
    });
  }

  const body = await readBody(event);
  const transcript = typeof body?.transcript === 'string' ? body.transcript : null;
  if (transcript == null) {
    throw createError({
      statusCode: 400,
      statusMessage: 'transcript is required',
    });
  }

  const result = db.prepare('UPDATE videos SET captions = ? WHERE video_id = ?').run(transcript, videoId);
  if (!result.changes) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Video not found',
    });
  }

  return { ok: true };
});
