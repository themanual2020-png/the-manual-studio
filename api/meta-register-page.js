// One-time setup action for each Facebook Page: admin pastes the Page ID
// (visible in the Meta Developer Console's page list) plus a Page Access
// Token generated there. Tokens generated via the Messenger API Settings
// "Generate Token" flow are scoped narrowly and can't read even `id` back
// via `/me` without extra permissions/feature review, so we take the page_id
// directly instead of relying on a Graph API identity lookup. The
// name/Instagram-account lookup is still attempted as a best-effort
// enrichment, but never blocks registration.
const { requireSession } = require('../lib/auth/verify-session');
const { supabaseRequest } = require('../lib/supabase/service-client');
const { lookupPageDetails } = require('../lib/meta/client');

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;
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
  const { page_id, access_token } = body || {};
  if (!page_id || typeof page_id !== 'string' || !access_token || typeof access_token !== 'string') {
    res.status(400).json({ error: 'page_id and access_token are required' });
    return;
  }

  try {
    const details = await lookupPageDetails(access_token).catch(() => ({ page_name: null, ig_account_id: null }));
    await supabaseRequest('/meta_pages?on_conflict=page_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        page_id,
        ig_account_id: details.ig_account_id,
        page_name: details.page_name,
        access_token,
        updated_at: new Date().toISOString(),
      }),
    });
    res.status(200).json({ ok: true, page: { page_id, ...details } });
  } catch (error) {
    console.error('meta-register-page error:', error);
    res.status(500).json({ error: 'failed to save page — check Supabase logs' });
  }
};
