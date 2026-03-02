import { db } from '~/server/db';
import { getTodayUsageSummary } from '~/server/utils/usage';

export default defineEventHandler(() => {
  const getWindowInfo = (fromRaw: unknown, toRaw: unknown): { label: string; activeMsPerDay: number } => {
    const from = Number(fromRaw);
    const to = Number(toRaw);
    const hasFrom = Number.isInteger(from) && from >= 0 && from <= 23;
    const hasTo = Number.isInteger(to) && to >= 0 && to <= 23;
    if (!hasFrom || !hasTo) {
      return { label: '24h', activeMsPerDay: 24 * 60 * 60 * 1000 };
    }
    if (from === to) {
      return { label: `${from}:00-${to}:00 (24h)`, activeMsPerDay: 24 * 60 * 60 * 1000 };
    }
    const hours = from < to ? (to - from) : (24 - (from - to));
    return { label: `${from}:00-${to}:00`, activeMsPerDay: hours * 60 * 60 * 1000 };
  };

  const channels = db.prepare(`
    SELECT channel_id, channel_name, thumbnail_url, is_active, check_interval, check_from_hour, check_to_hour, created_at, last_check
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
      const window = getWindowInfo(ch.check_from_hour, ch.check_to_hour);
      const perDay = Math.max(0, Math.floor(window.activeMsPerDay / Math.max(1, interval)));
      return {
        channel_id: ch.channel_id,
        channel_name: ch.channel_name,
        perDay,
        intervalMs: interval,
        window: window.label,
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
