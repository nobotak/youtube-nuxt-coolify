import { isAutoNewVideosCheckingEnabled } from '~/server/utils/app-settings';

export default defineEventHandler(() => {
  return {
    enabled: isAutoNewVideosCheckingEnabled(),
  };
});
