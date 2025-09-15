import ytDlp from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';

function getDownloadsDirectory(): string {
  const envDir = process.env.NUXT_DOWNLOADS_DIR || process.env.DOWNLOADS_DIR;
  if (envDir && envDir.trim().length > 0) {
    return envDir;
  }
  return path.join(process.cwd(), 'data', 'downloads');
}

function getDownloadsRetentionMs(): number | null {
  const hoursRaw = process.env.DOWNLOADS_TTL_HOURS || process.env.DOWNLOADS_RETENTION_HOURS;
  if (!hoursRaw) return 24 * 60 * 60 * 1000; // default 24h
  const hours = Number(hoursRaw);
  if (!Number.isFinite(hours) || hours <= 0) return null; // disabled if invalid or non-positive
  return Math.floor(hours * 60 * 60 * 1000);
}

export function ensureDownloadsDirectoryExists(): string {
  const dir = getDownloadsDirectory();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function cleanupOldDownloads(): void {
  const dir = ensureDownloadsDirectoryExists();
  const retentionMs = getDownloadsRetentionMs();
  if (retentionMs == null) return;
  const cutoff = Date.now() - retentionMs;
  try {
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;
      if (stat.mtimeMs < cutoff) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
  } catch {}
}

export async function downloadAudio(videoId: string) {
  const downloadsDir = ensureDownloadsDirectoryExists();
  const outputPath = path.join(downloadsDir, `${videoId}.mp3`);

  if (fs.existsSync(outputPath)) {
    console.log(`Audio for ${videoId} already exists.`);
    cleanupOldDownloads();
    return outputPath;
  }

  console.log(`Downloading audio for ${videoId}...`);
  await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
    extractAudio: true,
    audioFormat: 'mp3',
    output: outputPath,
  });

  console.log(`Audio for ${videoId} downloaded to ${outputPath}.`);
  cleanupOldDownloads();
  return outputPath;
}

export function getDownloadsDirectoryPath(): string {
  return getDownloadsDirectory();
}
