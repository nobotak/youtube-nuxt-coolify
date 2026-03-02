import { db } from '~/server/db';
import { getTodayUsageSummary } from '~/server/utils/usage';

export default defineEventHandler(() => {
  const channels = db.prepare(`
    SELECT channel_id, channel_name, thumbnail_url, is_active, check_interval, created_at, last_check
    FROM channels
    ORDER BY created_at DESC
  `).all() as Array<any>;

  const channelStatsRows = db.prepare(`
    SELECT
      channel_id,
      COUNT(*) as videos,
      SUM(CASE WHEN captions IS NOT NULL THEN 1 ELSE 0 END) as captions,
      SUM(CASE WHEN response IS NOT NULL THEN 1 ELSE 0 END) as ai
    FROM videos
    GROUP BY channel_id
  `).all() as Array<any>;

  const channelStats: Record<string, { videos: number; captions: number; ai: number }> = {};
  for (const row of channelStatsRows) {
    channelStats[row.channel_id] = {
      videos: Number(row.videos) || 0,
      captions: Number(row.captions) || 0,
      ai: Number(row.ai) || 0,
    };
  }

  const recentVideos = db.prepare(`
    SELECT
      v.video_id,
      v.channel_id,
      v.title,
      v.published_at,
      v.captions,
      v.response,
      c.channel_name
    FROM videos v
    LEFT JOIN channels c ON v.channel_id = c.channel_id
    WHERE datetime(v.published_at) >= datetime('now', '-3 days')
    ORDER BY v.published_at DESC
    LIMIT 100
  `).all();

  const totals = db.prepare(`
    SELECT
      COUNT(*) as totalVideos,
      SUM(CASE WHEN response IS NOT NULL THEN 1 ELSE 0 END) as totalAI
    FROM videos
  `).get() as any;

  const activeChannels = channels.reduce((sum, ch) => sum + (ch.is_active ? 1 : 0), 0);
  const usage = getTodayUsageSummary();

  const expectedBreakdown = channels
    .filter((ch) => ch.is_active)
    .map((ch) => {
      const interval = Number(ch.check_interval || 1800000);
      const perDay = Math.max(0, Math.floor(86400000 / Math.max(1, interval)));
      return {
        channel_id: ch.channel_id,
        channel_name: ch.channel_name,
        perDay,
        intervalMs: interval,
      };
    });
  const expectedTotal = expectedBreakdown.reduce((sum, row) => sum + row.perDay, 0);

  return {
    channels,
    channelStats,
    recentVideos,
    totals: {
      totalChannels: channels.length,
      activeChannels,
      totalVideos: Number(totals?.totalVideos) || 0,
      totalAI: Number(totals?.totalAI) || 0,
    },
    apiUsage: usage,
    apiExpected: {
      totalPerDay: expectedTotal,
      breakdown: expectedBreakdown,
    },
  };
});
