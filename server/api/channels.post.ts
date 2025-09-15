import { db } from '~/server/db';
import { getChannelInfo } from '~/server/utils/youtube';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { channel_id, api_key, check_interval } = body;

  if (!channel_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'channel_id is required',
    });
  }

  try {
    const channelInfo = await getChannelInfo(channel_id, api_key);

    if (!channelInfo || !channelInfo.id || !channelInfo.title) {
        throw new Error('Could not retrieve channel information.');
    }

    const stmt = db.prepare(
      `INSERT INTO channels (channel_id, channel_name, channel_url, thumbnail_url, api_key, check_interval) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(channel_id) DO UPDATE SET
         channel_name = excluded.channel_name,
         channel_url = excluded.channel_url,
         thumbnail_url = excluded.thumbnail_url,
         api_key = excluded.api_key,
         check_interval = excluded.check_interval;
      `
    );

    const result = stmt.run(
      channelInfo.id,
      channelInfo.title,
      `https://youtube.com/channel/${channelInfo.id}`,
      channelInfo.thumbnail,
      api_key, // Store the provided API key
      check_interval || 1800000 // Default to 30 minutes
    );

    return {
      id: result.lastInsertRowid,
      message: 'Channel added/updated successfully',
    };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message,
    });
  }
});
