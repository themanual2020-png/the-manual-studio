const crypto = require('crypto');
const { COOKIE_NAME, SESSION_TTL_SECONDS, createSessionToken, serializeCookie } = require('../lib/auth/session');

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
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
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  const token = createSessionToken();
  res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, token, req, { maxAgeSeconds: SESSION_TTL_SECONDS }));
  res.status(200).json({ ok: true });
};
