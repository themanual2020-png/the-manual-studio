const { requireSession } = require('../lib/auth/verify-session');
const { supabaseRequest } = require('../lib/supabase/service-client');

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    const platform = typeof req.query.platform === 'string' ? req.query.platform : null;
    let endpoint = '/conversations?order=last_message_at.desc.nullslast';
    if (platform) {
      endpoint += `&platform=eq.${encodeURIComponent(platform)}`;
    }
    const conversations = await supabaseRequest(endpoint);
    res.status(200).json({ conversations });
  } catch (error) {
    console.error('inbox-list error:', error);
    res.status(500).json({ error: 'failed to load conversations' });
  }
};
