import { savePushSubscription } from '~/server/utils/push';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const subscription = body?.subscription;
  const userAgent = getHeader(event, 'user-agent') || '';
  savePushSubscription(subscription, userAgent);
  return { ok: true };
});
