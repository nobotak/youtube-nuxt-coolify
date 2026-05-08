import { checkDueActiveChannels } from '~/server/utils/checker';
import { isAutoNewVideosCheckingEnabled } from '~/server/utils/app-settings';
import { recordLog } from '~/server/utils/logs';

const SCHEDULER_INTERVAL_MS = 60_000; // 1 min
const START_DELAY_MS = 10_000;

export default defineNitroPlugin(() => {
  const schedulerGlobalKey = '__ytAutoCheckSchedulerStarted';
  const globalObj = globalThis as Record<string, unknown>;
  if (globalObj[schedulerGlobalKey]) return;
  globalObj[schedulerGlobalKey] = true;

  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      if (!isAutoNewVideosCheckingEnabled()) return;
      await checkDueActiveChannels();
    } catch (error) {
      console.error('[scheduler] auto-check tick failed:', error);
      try { recordLog('scheduler_auto_check_error', String(error)); } catch {}
    } finally {
      running = false;
    }
  };

  setTimeout(() => {
    void tick();
  }, START_DELAY_MS);

  setInterval(() => {
    void tick();
  }, SCHEDULER_INTERVAL_MS);
});
