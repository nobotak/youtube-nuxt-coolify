import { db } from '~/server/db';
import { getLatestVideos } from '~/server/utils/youtube';
import { parseISO8601Duration } from '~/server/utils/formatters';
import { getCaptions } from '~/server/utils/captions';
import { recordLog } from '~/server/utils/logs';
import { sendPushToAll } from '~/server/utils/push';

function isWithinAllowedHours(channel: any): boolean {
  const fromHour = Number(channel?.check_from_hour);
  const toHour = Number(channel?.check_to_hour);
  const hasFrom = Number.isInteger(fromHour) && fromHour >= 0 && fromHour <= 23;
  const hasTo = Number.isInteger(toHour) && toHour >= 0 && toHour <= 23;
  if (!hasFrom || !hasTo) return true;

  const currentHour = new Date().getHours();
  if (fromHour === toHour) return true;
  if (fromHour < toHour) {
    return currentHour >= fromHour && currentHour < toHour;
  }
  return currentHour >= fromHour || currentHour < toHour;
}

function isChannelDue(channel: any, nowMs = Date.now()): boolean {
  const intervalMs = Math.max(1, Number(channel?.check_interval || 1800000));
  const lastCheckRaw = channel?.last_check;
  if (!lastCheckRaw) return true;
  const lastCheckMs = new Date(lastCheckRaw).getTime();
  if (!Number.isFinite(lastCheckMs)) return true;
  return nowMs - lastCheckMs >= intervalMs;
}

function markChannelChecked(channelId: string): void {
  db.prepare('UPDATE channels SET last_check = CURRENT_TIMESTAMP WHERE channel_id = ?').run(channelId);
}

export async function checkChannelVideos(channel: any) {
  console.log(`Checking videos for channel: ${channel.channel_name}`);
  try { recordLog('check_channel_start', channel.channel_name || channel.channel_id); } catch {}
  let insertedCount = 0;
  
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
        // Skip videos shorter than 5 minutes (300s)
        if (durationInSeconds < 300) {
          continue;
        }
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
      insertedCount = rowsToInsert.length;
      
    } else {
      console.log(`No new videos for channel ${channel.channel_name}.`);
    }

  } catch (error) {
    console.error(`Error checking videos for channel ${channel.channel_name}:`, error);
    try { recordLog('check_channel_error', String(error)); } catch {}
  }
  return insertedCount;
}

export async function checkAllActiveChannels() {
    console.log('Checking all active channels...');
    try { recordLog('check_all_start'); } catch {}
    const channels = db.prepare('SELECT * FROM channels WHERE is_active = 1').all();
    let totalInserted = 0;
    let channelsWithNew = 0;
    for (const channel of channels) {
        if (!isWithinAllowedHours(channel)) {
            console.log(`Skipping channel outside allowed hours: ${channel.channel_name || channel.channel_id}`);
            try { recordLog('check_channel_skipped_window', channel.channel_name || channel.channel_id); } catch {}
            continue;
        }
        const inserted = await checkChannelVideos(channel);
        if (inserted > 0) {
            totalInserted += inserted;
            channelsWithNew += 1;
        }
        markChannelChecked(channel.channel_id);
    }
    if (totalInserted > 0) {
        try {
            await sendPushToAll({
                title: 'Nowe filmy w YouTube Manager',
                body: `Wykryto ${totalInserted} nowych filmów w ${channelsWithNew} kanałach.`,
                url: '/videos',
            });
        } catch (error) {
            try { recordLog('push_send_error', String(error)); } catch {}
        }
    }
    console.log('Finished checking all active channels.');
    try { recordLog('check_all_done'); } catch {}
}

export async function checkDueActiveChannels() {
    const nowMs = Date.now();
    const channels = db.prepare('SELECT * FROM channels WHERE is_active = 1').all();
    let totalInserted = 0;
    let channelsWithNew = 0;
    for (const channel of channels) {
        if (!isWithinAllowedHours(channel)) continue;
        if (!isChannelDue(channel, nowMs)) continue;
        const inserted = await checkChannelVideos(channel);
        if (inserted > 0) {
            totalInserted += inserted;
            channelsWithNew += 1;
        }
        markChannelChecked(channel.channel_id);
    }
    if (totalInserted > 0) {
        try {
            await sendPushToAll({
                title: 'Nowe filmy w YouTube Manager',
                body: `Scheduler wykrył ${totalInserted} nowych filmów w ${channelsWithNew} kanałach.`,
                url: '/videos',
            });
        } catch (error) {
            try { recordLog('push_send_error', String(error)); } catch {}
        }
    }
}
