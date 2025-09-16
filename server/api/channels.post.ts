import { db } from '~/server/db';
import { getChannelInfo, resolveChannelId } from '~/server/utils/youtube';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { channel_id, api_key, check_interval, is_active, channel_name, channel_url } = body as any;

  if (!channel_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'channel_id is required',
    });
  }

  try {
    // Allow @handle or full link; resolve to UC* id if needed
    const resolvedId = await resolveChannelId(channel_id, api_key).catch(() => channel_id);
    const channelInfo = await getChannelInfo(resolvedId, api_key);

    if (!channelInfo || !channelInfo.id || !channelInfo.title) {
        throw new Error('Could not retrieve channel information.');
    }

    const stmt = db.prepare(
      `INSERT INTO channels (channel_id, channel_name, channel_url, thumbnail_url, api_key, check_interval, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, 1))
       ON CONFLICT(channel_id) DO UPDATE SET
         channel_name = excluded.channel_name,
         channel_url = excluded.channel_url,
         thumbnail_url = excluded.thumbnail_url,
         api_key = excluded.api_key,
         check_interval = excluded.check_interval,
         is_active = COALESCE(excluded.is_active, channels.is_active);
      `
    );

    const result = stmt.run(
      channelInfo.id,
      channel_name || channelInfo.title,
      channel_url || `https://youtube.com/channel/${channelInfo.id}`,
      channelInfo.thumbnail,
      api_key,
      check_interval || 1800000,
      typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null
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
