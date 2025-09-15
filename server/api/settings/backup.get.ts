import fs from 'fs';
import path from 'path';
import { DB_PATH } from '~/server/db';

export default defineEventHandler(async (event) => {
  const dbPath = DB_PATH;
  if (!fs.existsSync(dbPath)) {
    throw createError({ statusCode: 404, statusMessage: 'Database file not found' });
  }

  const stats = fs.statSync(dbPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `youtube_videos_backup_${timestamp}.db`;

  setHeader(event, 'Content-Type', 'application/octet-stream');
  setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`);
  setHeader(event, 'Content-Length', String(stats.size));

  return sendStream(event, fs.createReadStream(dbPath));
});


