import { db } from '~/server/db';

export default defineEventHandler((event) => {
  const channelId = event.context.params?.channelId;
  if (!channelId) {
    throw createError({ statusCode: 400, statusMessage: 'Channel ID is required' });
  }

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_videos,
      SUM(CASE WHEN captions IS NOT NULL THEN 1 ELSE 0 END) as with_captions,
      SUM(CASE WHEN response IS NOT NULL THEN 1 ELSE 0 END) as with_ai
    FROM videos WHERE channel_id = ?
  `).get(channelId) as any;

  const channelRow = db.prepare(`
    SELECT
      id,
      channel_id,
      channel_name,
      channel_url,
      thumbnail_url,
      is_active,
      check_interval,
      check_from_hour,
      check_to_hour,
      created_at,
      last_check,
      CASE WHEN api_key IS NOT NULL AND LENGTH(TRIM(api_key)) > 0 THEN 1 ELSE 0 END as has_custom_api_key
    FROM channels
    WHERE channel_id = ?
  `).get(channelId) as any;
  return { channel: channelRow, stats: {
    total_videos: Number(stats?.total_videos || 0),
    with_captions: Number(stats?.with_captions || 0),
    with_ai_analysis: Number(stats?.with_ai || 0)
  }};
});


