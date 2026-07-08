const { requireSession } = require('../lib/auth/verify-session');

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;
  res.status(200).json({ ok: true });
};
