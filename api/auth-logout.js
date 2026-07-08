const { clearCookie } = require('../lib/auth/session');

module.exports = async function handler(req, res) {
  res.setHeader('Set-Cookie', clearCookie(req));
  res.status(200).json({ ok: true });
};
