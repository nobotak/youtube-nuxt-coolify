import { db } from '~/server/db';
import { getLatestVideos } from '~/server/utils/youtube';
import { parseISO8601Duration } from '~/server/utils/formatters';
import { getCaptions } from '~/server/utils/captions';

export async function checkChannelVideos(channel: any) {
  console.log(`Checking videos for channel: ${channel.channel_name}`);
  
  try {
    const videos = await getLatestVideos(channel.channel_id, channel.api_key);

    if (videos.length === 0) {
      console.log(`No videos found for channel ${channel.channel_name}.`);
      return;
    }

    const videoIds = videos.map(v => v.id).filter(id => id) as string[];
    if (videoIds.length === 0) {
        return;
    }

    const placeholders = videoIds.map(() => '?').join(',');
    const stmt = db.prepare(`SELECT video_id FROM videos WHERE video_id IN (${placeholders})`);
    const existingVideoRows = stmt.all(...videoIds);
    const existingVideoIds = new Set(existingVideoRows.map((row: any) => row.video_id));

    const newVideos = videos.filter(video => video.id && !existingVideoIds.has(video.id));

    if (newVideos.length > 0) {
      console.log(`Found ${newVideos.length} new videos for channel ${channel.channel_name}.`);
      
      const insertStmt = db.prepare(
        'INSERT OR IGNORE INTO videos (video_id, channel_id, title, published_at, duration, type, captions) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      
      // Precompute async work (captions) outside of transaction, then insert synchronously
      const rowsToInsert: Array<[
        string,
        string,
        string,
        string,
        string,
        string,
        string | null
      ]> = [];

      for (const video of newVideos) {
        if (!video.id || !video.snippet || !video.contentDetails) continue;
        const captions = await getCaptions(video.id);
        const durationInSeconds = parseISO8601Duration(video.contentDetails.duration || 'PT0S');
        const type = durationInSeconds <= 60 ? 'short' : 'video';
        rowsToInsert.push([
          video.id,
          channel.channel_id,
          video.snippet.title,
          video.snippet.publishedAt,
          video.contentDetails.duration,
          type,
          captions ? JSON.stringify(captions) : null
        ]);
      }

      const insertMany = db.transaction((rows: typeof rowsToInsert) => {
        for (const row of rows) {
          insertStmt.run(...row);
        }
      });

      insertMany(rowsToInsert);
      
    } else {
      console.log(`No new videos for channel ${channel.channel_name}.`);
    }

  } catch (error) {
    console.error(`Error checking videos for channel ${channel.channel_name}:`, error);
  }
}

export async function checkAllActiveChannels() {
    console.log('Checking all active channels...');
    const channels = db.prepare('SELECT * FROM channels WHERE is_active = 1').all();
    for (const channel of channels) {
        await checkChannelVideos(channel);
    }
    console.log('Finished checking all active channels.');
}
