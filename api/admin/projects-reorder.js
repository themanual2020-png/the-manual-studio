// Session-gated bulk sort_order update for the `projects` table.
const { requireSession } = require('../../lib/auth/verify-session');

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set' });
    return;
  }

  const order = req.body && req.body.order;
  if (!Array.isArray(order)) {
    res.status(400).json({ error: 'invalid body' });
    return;
  }

  try {
    await Promise.all(
      order.map(({ id, sort_order }) =>
        fetch(`${SUPA_URL}/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sort_order }),
        })
      )
    );
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
