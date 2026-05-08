import { removePushSubscription } from '~/server/utils/push';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  removePushSubscription(body?.endpoint);
  return { ok: true };
});
