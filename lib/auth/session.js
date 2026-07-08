// Signed session cookie helpers used by api/auth-login.js, api/auth-logout.js,
// and lib/auth/verify-session.js. Stateless (no session table) — the signature
// and expiry are enough to trust the cookie server-side.
const crypto = require('crypto');

const COOKIE_NAME = 'tms_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
  return secret;
}

function sign(payloadB64) {
  return crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

function createSessionToken() {
  const payload = { exp: Date.now() + SESSION_TTL_SECONDS * 1000 };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;

  const [payloadB64, sig] = token.split('.');
  let expectedBuf;
  let sigBuf;
  try {
    expectedBuf = Buffer.from(sign(payloadB64), 'base64url');
    sigBuf = Buffer.from(sig, 'base64url');
  } catch {
    return false;
  }
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return false;
  }
  return typeof payload.exp === 'number' && Date.now() <= payload.exp;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    cookies[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return cookies;
}

function isSecureRequest(req) {
  return process.env.VERCEL_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
}

function serializeCookie(name, value, req, { maxAgeSeconds } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict'];
  if (isSecureRequest(req)) parts.push('Secure');
  if (typeof maxAgeSeconds === 'number') parts.push(`Max-Age=${maxAgeSeconds}`);
  return parts.join('; ');
}

function clearCookie(req) {
  return serializeCookie(COOKIE_NAME, '', req, { maxAgeSeconds: 0 });
}

module.exports = {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
  parseCookies,
  serializeCookie,
  clearCookie,
};
