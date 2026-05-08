import { setAutoNewVideosCheckingEnabled } from '~/server/utils/app-settings';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const enabled = !!body?.enabled;
  setAutoNewVideosCheckingEnabled(enabled);
  return { success: true, enabled };
});
