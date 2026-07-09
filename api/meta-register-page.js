// One-time setup action for each Facebook Page: admin pastes a Page Access
// Token generated in the Meta Developer Console, and this looks up the
// Page's identity (and linked Instagram Business Account, if any) so no
// manual ID lookups are needed.
const { requireSession } = require('../lib/auth/verify-session');
const { supabaseRequest } = require('../lib/supabase/service-client');
const { registerPage } = require('../lib/meta/client');

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
  const { access_token } = body || {};
  if (!access_token || typeof access_token !== 'string') {
    res.status(400).json({ error: 'access_token is required' });
    return;
  }

  try {
    const info = await registerPage(access_token);
    await supabaseRequest('/meta_pages?on_conflict=page_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        page_id: info.page_id,
        ig_account_id: info.ig_account_id,
        page_name: info.page_name,
        access_token,
        updated_at: new Date().toISOString(),
      }),
    });
    res.status(200).json({ ok: true, page: info });
  } catch (error) {
    console.error('meta-register-page error:', error);
    res.status(500).json({ error: 'failed to register page — check the token is valid' });
  }
};
