import { db } from '~/server/db';

export default defineEventHandler((event) => {
  try {
    const stmt = db.prepare(`
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
      ORDER BY created_at DESC
    `);
    const channels = stmt.all();
    return channels;
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message,
    });
  }
});
