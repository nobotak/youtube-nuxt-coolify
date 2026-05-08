import { sendPushToAll } from '~/server/utils/push';

export default defineEventHandler(async () => {
  try {
    const result = await sendPushToAll({
      title: 'YouTube Manager',
      body: 'To jest testowe powiadomienie push.',
      url: '/settings',
    });
    return {
      ok: true,
      ...result,
    };
  } catch (error: any) {
    throw createError({
      statusCode: Number(error?.statusCode || 500),
      statusMessage: error?.statusMessage || error?.message || 'Push test failed.',
    });
  }
});
