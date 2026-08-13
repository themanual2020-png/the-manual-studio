// Session-gated proxy for writing to the `projects` table. Uses the Supabase
// service role key (server-only, bypasses RLS) so the browser never holds a
// key capable of writing — only a logged-in admin session can reach this.
//
// POST ?action=reorder handles the bulk sort_order update (merged in here,
// rather than its own file, to stay under Vercel Hobby's 12-function cap).
const { requireSession } = require('../../lib/auth/verify-session');

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';

async function handleReorder(req, res, key) {
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
}

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set' });
    return;
  }

  const { id, action } = req.query;
  const method = req.method;

  if (method === 'POST' && action === 'reorder') {
    await handleReorder(req, res, key);
    return;
  }

  let path = '/rest/v1/projects';
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  if (method === 'POST') {
    headers.Prefer = 'return=representation';
  } else if (method === 'PATCH' || method === 'DELETE') {
    if (!id) {
      res.status(400).json({ error: 'missing id' });
      return;
    }
    path += `?id=eq.${encodeURIComponent(id)}`;
  } else {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    const r = await fetch(`${SUPA_URL}${path}`, {
      method,
      headers,
      body: method === 'DELETE' ? undefined : JSON.stringify(req.body),
    });
    const text = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text || '{}');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
