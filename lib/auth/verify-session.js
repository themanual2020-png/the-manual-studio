// Shared guard for every endpoint that touches chat inbox data. Rejects with
// 401 before any Supabase call if the session cookie is missing/invalid/expired.
const { COOKIE_NAME, parseCookies, verifySessionToken } = require('./session');

function requireSession(req, res) {
  const cookies = parseCookies(req);
  if (!verifySessionToken(cookies[COOKIE_NAME])) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

module.exports = { requireSession };
