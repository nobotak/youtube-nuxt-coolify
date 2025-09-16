import { db } from '~/server/db';
import { getTodayUsageSummary } from '~/server/utils/usage';

export default defineEventHandler(() => {
  const channelsCount = db.prepare('SELECT COUNT(*) as c FROM channels').get() as any;
  const activeChannelsCount = db.prepare('SELECT COUNT(*) as c FROM channels WHERE is_active = 1').get() as any;
  const videosCount = db.prepare('SELECT COUNT(*) as c FROM videos').get() as any;
  const videosWithCaptions = db.prepare('SELECT COUNT(*) as c FROM videos WHERE captions IS NOT NULL').get() as any;
  const videosWithAI = db.prepare('SELECT COUNT(*) as c FROM videos WHERE response IS NOT NULL').get() as any;

  const usage = getTodayUsageSummary();

  // Expected (theoretical) API usage per day based on active channels' check_interval
  const activeChannels = db.prepare('SELECT channel_id, channel_name, check_interval FROM channels WHERE is_active = 1').all() as Array<any>;
  const expectedBreakdown = activeChannels.map((ch) => {
    const interval = Number(ch.check_interval || 1800000); // default 30 min
    const perDay = Math.max(0, Math.floor(86400000 / Math.max(1, interval)));
    return {
      channel_id: ch.channel_id,
      channel_name: ch.channel_name,
      perDay,
      intervalMs: interval,
    };
  });
  const expectedTotal = expectedBreakdown.reduce((s, r) => s + r.perDay, 0);

  return {
    channels: channelsCount.c || 0,
    activeChannels: activeChannelsCount.c || 0,
    videos: videosCount.c || 0,
    captions: videosWithCaptions.c || 0,
    aiResponses: videosWithAI.c || 0,
    apiUsage: usage,
    apiExpected: {
      totalPerDay: expectedTotal,
      breakdown: expectedBreakdown,
    },
  };
});


