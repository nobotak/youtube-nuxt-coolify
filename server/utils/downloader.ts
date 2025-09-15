import ytDlp from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';

export async function downloadAudio(videoId: string) {
  const downloadsDir = path.join(process.cwd(), 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const outputPath = path.join(downloadsDir, `${videoId}.mp3`);

  if (fs.existsSync(outputPath)) {
    console.log(`Audio for ${videoId} already exists.`);
    return outputPath;
  }

  console.log(`Downloading audio for ${videoId}...`);
  await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
    extractAudio: true,
    audioFormat: 'mp3',
    output: outputPath,
  });

  console.log(`Audio for ${videoId} downloaded to ${outputPath}.`);
  return outputPath;
}
