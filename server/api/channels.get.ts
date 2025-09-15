import { db } from '~/server/db';

export default defineEventHandler((event) => {
  try {
    const stmt = db.prepare('SELECT * FROM channels ORDER BY created_at DESC');
    const channels = stmt.all();
    return channels;
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message,
    });
  }
});
