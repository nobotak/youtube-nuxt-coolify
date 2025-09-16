import { db } from '~/server/db';

export default defineEventHandler(async (event) => {
  const channelId = event.context.params?.channelId;
  if (!channelId) {
    throw createError({ statusCode: 400, statusMessage: 'Channel ID is required' });
  }
  const body = await readBody(event);
  const { channel_name, channel_url, check_interval, is_active } = body as any;

  const stmt = db.prepare(`
    UPDATE channels SET 
      channel_name = COALESCE(?, channel_name),
      channel_url = COALESCE(?, channel_url),
      check_interval = COALESCE(?, check_interval),
      is_active = COALESCE(?, is_active)
    WHERE channel_id = ?
  `);
  stmt.run(
    channel_name ?? null,
    channel_url ?? null,
    check_interval ?? null,
    typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null,
    channelId
  );
  return { success: true };
});


