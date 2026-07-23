// Session-gated proxy for writing to the `site_settings` table.
const { requireSession } = require('../../lib/auth/verify-session');

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;

  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set' });
    return;
  }

  const { page } = req.query;
  if (!page) {
    res.status(400).json({ error: 'missing page' });
    return;
  }

  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/site_settings?page=eq.${encodeURIComponent(page)}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const text = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text || '{}');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
