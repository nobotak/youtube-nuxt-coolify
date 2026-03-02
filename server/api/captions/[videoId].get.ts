import { getYoutubeTranscript } from '~/server/utils/turboscribe';
import { db } from '~/server/db';

export default defineEventHandler(async (event) => {
  const videoId = event.context.params?.videoId;

  if (!videoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Video ID is required',
    });
  }

  try {
    const transcript = await getYoutubeTranscript(videoId, 'Polish');
    db.prepare('UPDATE videos SET captions = ? WHERE video_id = ?').run(transcript, videoId);
    return { transcript };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message,
    });
  }
});
