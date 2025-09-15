import fs from 'fs';
import path from 'path';
import { getDownloadsDirectoryPath } from '~/server/utils/downloader';

export default defineEventHandler((event) => {
  const downloadsDir = getDownloadsDirectoryPath();
  
  if (!fs.existsSync(downloadsDir)) {
    return [];
  }

  const files = fs.readdirSync(downloadsDir)
    .filter(file => file.endsWith('.mp3'))
    .map(file => {
      const filePath = path.join(downloadsDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        createdAt: stats.birthtime,
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return files;
});
