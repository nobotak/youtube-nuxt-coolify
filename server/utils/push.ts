import * as webpush from 'web-push';
import { db } from '~/server/db';
import { recordLog } from '~/server/utils/logs';

type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

let vapidConfigured = false;

function getVapidConfig() {
  const subject = String(process.env.PUSH_VAPID_SUBJECT || '').trim();
  const publicKey = String(process.env.PUSH_VAPID_PUBLIC_KEY || '').trim();
  const privateKey = String(process.env.PUSH_VAPID_PRIVATE_KEY || '').trim();
  return { subject, publicKey, privateKey };
}

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const { subject, publicKey, privateKey } = getVapidConfig();
  if (!subject || !publicKey || !privateKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Brakuje PUSH_VAPID_SUBJECT / PUSH_VAPID_PUBLIC_KEY / PUSH_VAPID_PRIVATE_KEY.',
    });
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export function getPushVapidPublicKey() {
  const { publicKey } = getVapidConfig();
  if (!publicKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Brakuje PUSH_VAPID_PUBLIC_KEY.',
    });
  }
  return publicKey;
}

export function savePushSubscription(subscription: any, userAgent?: string) {
  const endpoint = String(subscription?.endpoint || '').trim();
  const p256dh = String(subscription?.keys?.p256dh || '').trim();
  const auth = String(subscription?.keys?.auth || '').trim();
  if (!endpoint || !p256dh || !auth) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nieprawidłowa subskrypcja push.',
    });
  }

  db.prepare(`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_agent, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(endpoint) DO UPDATE SET
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      user_agent = excluded.user_agent,
      updated_at = CURRENT_TIMESTAMP
  `).run(endpoint, p256dh, auth, userAgent || null);
}

export function removePushSubscription(endpointRaw: unknown) {
  const endpoint = String(endpointRaw || '').trim();
  if (!endpoint) return;
  db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
}

function getAllSubscriptions(): StoredSubscription[] {
  return db
    .prepare('SELECT endpoint, p256dh, auth FROM push_subscriptions')
    .all() as StoredSubscription[];
}

function isValidVapidSubject(subject: string): boolean {
  if (!subject) return false;
  if (subject.startsWith('mailto:')) {
    return subject.length > 'mailto:'.length;
  }
  try {
    const url = new URL(subject);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getPushDiagnostics() {
  const { subject, publicKey, privateKey } = getVapidConfig();
  const subscriptionsCount = Number(
    (db.prepare('SELECT COUNT(*) as cnt FROM push_subscriptions').get() as { cnt?: number })?.cnt || 0
  );

  const issues: string[] = [];
  if (!subject) issues.push('Brak PUSH_VAPID_SUBJECT');
  if (!publicKey) issues.push('Brak PUSH_VAPID_PUBLIC_KEY');
  if (!privateKey) issues.push('Brak PUSH_VAPID_PRIVATE_KEY');
  if (subject && !isValidVapidSubject(subject)) {
    issues.push('PUSH_VAPID_SUBJECT musi być mailto:... lub pełnym URL (https://...)');
  }
  if (publicKey && publicKey.length < 80) issues.push('PUSH_VAPID_PUBLIC_KEY wygląda na niepoprawny (za krótki)');
  if (privateKey && privateKey.length < 40) issues.push('PUSH_VAPID_PRIVATE_KEY wygląda na niepoprawny (za krótki)');
  if (subscriptionsCount === 0) {
    issues.push('Brak subskrypcji push (włącz push w przeglądarce i zapisz subskrypcję).');
  }

  return {
    hasSubject: !!subject,
    hasPublicKey: !!publicKey,
    hasPrivateKey: !!privateKey,
    subjectFormatValid: isValidVapidSubject(subject),
    subjectPreview: subject ? `${subject.slice(0, 32)}${subject.length > 32 ? '...' : ''}` : '',
    publicKeyLength: publicKey.length,
    privateKeyLength: privateKey.length,
    subscriptionsCount,
    issues,
  };
}

function removeInvalidSubscription(endpoint: string) {
  db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
}

export async function sendPushToAll(payload: { title: string; body: string; url?: string }) {
  const subscriptions = getAllSubscriptions();
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  ensureVapidConfigured();
  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        message
      );
      sent += 1;
    } catch (error: any) {
      failed += 1;
      const statusCode = Number(error?.statusCode || 0);
      if (statusCode === 404 || statusCode === 410) {
        removeInvalidSubscription(sub.endpoint);
      }
      try {
        recordLog('push_send_error', `${statusCode || 'unknown'} ${error?.message || 'unknown'}`);
      } catch {}
    }
  }

  return { sent, failed };
}
