import { sendPushToAll } from '~/server/utils/push';

export default defineEventHandler(async () => {
  const result = await sendPushToAll({
    title: 'YouTube Manager',
    body: 'To jest testowe powiadomienie push.',
    url: '/settings',
  });
  return {
    ok: true,
    ...result,
  };
});
