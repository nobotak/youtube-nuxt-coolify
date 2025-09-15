import { db } from '~/server/db';

export default defineEventHandler((event) => {
  try {
    const stmt = db.prepare(`
      SELECT v.*, c.channel_name 
      FROM videos v
      LEFT JOIN channels c ON v.channel_id = c.channel_id
      ORDER BY v.published_at DESC
    `);
    const videos = stmt.all();
    return videos;
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message,
    });
  }
});
