import { getQuery } from 'ufo';
import { getRecentLogs } from '~/server/utils/logs';

export default defineEventHandler((event) => {
  // optional ?limit=number
  const q = getQuery(event.node.req.url || '');
  const limit = Math.max(1, Math.min(100, Number((q as any).limit || 20)));
  return getRecentLogs(limit);
});


