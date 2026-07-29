const crypto = require('crypto');
const { COOKIE_NAME, SESSION_TTL_SECONDS, createSessionToken, serializeCookie } = require('../lib/auth/session');

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function countRecentFailures(key, ip) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const r = await fetch(
    `${SUPA_URL}/rest/v1/login_attempts?ip=eq.${encodeURIComponent(ip)}&created_at=gte.${encodeURIComponent(since)}&select=id`,
    { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' } }
  );
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

async function recordFailure(key, ip) {
  await fetch(`${SUPA_URL}/rest/v1/login_attempts`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ ip }),
  }).catch(() => {});
}

async function clearFailures(key, ip) {
  await fetch(`${SUPA_URL}/rest/v1/login_attempts?ip=eq.${encodeURIComponent(ip)}`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).catch(() => {});
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ip = getClientIp(req);

  if (serviceKey) {
    const failures = await countRecentFailures(serviceKey, ip).catch(() => 0);
    if (failures >= MAX_ATTEMPTS) {
      res.status(429).json({ error: 'พยายามเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง' });
      return;
    }
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const { username, password } = body || {};

  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) {
    res.status(500).json({ error: 'admin credentials not configured' });
    return;
  }

  const usernameOk = typeof username === 'string' && safeEqual(username, expectedUsername);
  const passwordOk = typeof password === 'string' && safeEqual(password, expectedPassword);
  if (!usernameOk || !passwordOk) {
    if (serviceKey) await recordFailure(serviceKey, ip);
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  if (serviceKey) await clearFailures(serviceKey, ip);

  const token = createSessionToken();
  res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, token, req, { maxAgeSeconds: SESSION_TTL_SECONDS }));
  res.status(200).json({ ok: true });
};
