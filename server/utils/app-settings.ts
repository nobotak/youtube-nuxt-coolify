import { db } from '~/server/db';

const AUTO_NEW_VIDEOS_CHECKING_KEY = 'auto_new_videos_checking';

function getSettingRaw(key: string): string | null {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value?: string } | undefined;
  return row?.value ?? null;
}

function setSettingRaw(key: string, value: string): void {
  db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = CURRENT_TIMESTAMP
  `).run(key, value);
}

export function isAutoNewVideosCheckingEnabled(): boolean {
  const raw = getSettingRaw(AUTO_NEW_VIDEOS_CHECKING_KEY);
  return raw === '1' || raw === 'true';
}

export function setAutoNewVideosCheckingEnabled(enabled: boolean): void {
  setSettingRaw(AUTO_NEW_VIDEOS_CHECKING_KEY, enabled ? '1' : '0');
}
