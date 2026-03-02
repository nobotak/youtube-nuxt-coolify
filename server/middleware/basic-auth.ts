import { defineEventHandler, getRequestHeader, getRequestURL, setResponseHeader, type H3Event } from 'h3';
import { timingSafeEqual } from 'node:crypto';

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function unauthorized(event: H3Event) {
  setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="YT Manager"');
  throw createError({ statusCode: 401, statusMessage: 'Authentication required' });
}

export default defineEventHandler((event) => {
  const username = process.env.PANEL_AUTH_USERNAME;
  const password = process.env.PANEL_AUTH_PASSWORD;

  // If auth variables are missing, deny access to avoid exposing the panel.
  if (!username || !password) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Panel auth is not configured. Set PANEL_AUTH_USERNAME and PANEL_AUTH_PASSWORD.',
    });
  }

  const requestPath = getRequestURL(event).pathname;
  // Keep a no-auth health endpoint available for platform checks.
  if (requestPath === '/healthz' || requestPath === '/api/healthz') return;

  const authHeader = getRequestHeader(event, 'authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    unauthorized(event);
  }

  const encoded = authHeader.slice('Basic '.length).trim();
  let decoded = '';
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    unauthorized(event);
  }

  const separatorIdx = decoded.indexOf(':');
  if (separatorIdx < 0) unauthorized(event);
  const incomingUser = decoded.slice(0, separatorIdx);
  const incomingPassword = decoded.slice(separatorIdx + 1);

  if (!safeEqual(incomingUser, username) || !safeEqual(incomingPassword, password)) {
    unauthorized(event);
  }
});
