import { db } from '~/server/db';
import { getTodayUsageSummary } from '~/server/utils/usage';

export default defineEventHandler(() => {
  const channelsCount = db.prepare('SELECT COUNT(*) as c FROM channels').get() as any;
  const activeChannelsCount = db.prepare('SELECT COUNT(*) as c FROM channels WHERE is_active = 1').get() as any;
  const videosCount = db.prepare('SELECT COUNT(*) as c FROM videos').get() as any;
  const videosWithCaptions = db.prepare('SELECT COUNT(*) as c FROM videos WHERE captions IS NOT NULL').get() as any;
  const videosWithAI = db.prepare('SELECT COUNT(*) as c FROM videos WHERE response IS NOT NULL').get() as any;

  const usage = getTodayUsageSummary();

  return {
    channels: channelsCount.c || 0,
    activeChannels: activeChannelsCount.c || 0,
    videos: videosCount.c || 0,
    captions: videosWithCaptions.c || 0,
    aiResponses: videosWithAI.c || 0,
    apiUsage: usage,
  };
});


