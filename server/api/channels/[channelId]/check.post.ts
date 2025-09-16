import { db } from '~/server/db';
import { checkChannelVideos } from '~/server/utils/checker';

export default defineEventHandler(async (event) => {
  const channelId = event.context.params?.channelId;
  if (!channelId) {
    throw createError({ statusCode: 400, statusMessage: 'Channel ID is required' });
  }
  const channel = db.prepare('SELECT * FROM channels WHERE channel_id = ?').get(channelId) as any;
  if (!channel) {
    throw createError({ statusCode: 404, statusMessage: 'Channel not found' });
  }
  // Run check for this specific channel
  await checkChannelVideos(channel);
  // update last_check
  db.prepare('UPDATE channels SET last_check = CURRENT_TIMESTAMP WHERE channel_id = ?').run(channelId);
  return { success: true };
});


