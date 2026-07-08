const { requireSession } = require('../lib/auth/verify-session');
const { supabaseRequest } = require('../lib/supabase/service-client');

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const conversationId = req.query.conversation_id;
  if (!conversationId || typeof conversationId !== 'string') {
    res.status(400).json({ error: 'conversation_id is required' });
    return;
  }

  try {
    const messages = await supabaseRequest(
      `/messages?conversation_id=eq.${encodeURIComponent(conversationId)}&order=created_at.asc`
    );
    res.status(200).json({ messages });
  } catch (error) {
    console.error('inbox-thread error:', error);
    res.status(500).json({ error: 'failed to load thread' });
  }
};
