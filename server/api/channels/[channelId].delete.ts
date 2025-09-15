import { db } from '~/server/db';

export default defineEventHandler((event) => {
  const channelId = event.context.params?.channelId;

  if (!channelId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Channel ID is required',
    });
  }
  
  try {
    const stmt = db.prepare('DELETE FROM channels WHERE channel_id = ?');
    const result = stmt.run(channelId);

    if (result.changes === 0) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Channel not found',
        });
    }

    return { message: 'Channel deleted successfully' };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message,
    });
  }
});
