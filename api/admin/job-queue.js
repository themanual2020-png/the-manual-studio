// Session-gated CRUD for internal admin tables (job_queue, saved_items).
// Both tables have zero RLS policies — only the service role key (used
// here, server-side only) can touch them at all. Kept as one function
// (switched via ?resource=) to stay under Vercel Hobby's 12-function cap —
// see api/admin/projects.js for the same pattern with ?action=reorder.
const { requireSession } = require('../../lib/auth/verify-session');

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';

const RESOURCES = {
  'job-queue': { table: 'job_queue', order: 'date.asc' },
  'saved-items': { table: 'saved_items', order: 'created_at.desc' },
};

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set' });
    return;
  }

  const { id, resource } = req.query;
  const { table, order } = RESOURCES[resource] || RESOURCES['job-queue'];
  const method = req.method;
  let path = `/rest/v1/${table}`;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  if (method === 'GET') {
    path += `?select=*&order=${order}`;
  } else if (method === 'POST') {
    headers.Prefer = 'return=representation';
  } else if (method === 'PATCH' || method === 'DELETE') {
    if (!id) {
      res.status(400).json({ error: 'missing id' });
      return;
    }
    path += `?id=eq.${encodeURIComponent(id)}`;
    if (method === 'PATCH') headers.Prefer = 'return=representation';
  } else {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    const r = await fetch(`${SUPA_URL}${path}`, {
      method,
      headers,
      body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(req.body),
    });
    const text = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text || '{}');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
