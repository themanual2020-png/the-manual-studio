const { requireSession } = require('../lib/auth/verify-session');
const { supabaseRequest } = require('../lib/supabase/service-client');

async function findOrCreateFastworkConversation(customerName, conversationId) {
  if (conversationId) {
    const existing = await supabaseRequest(`/conversations?id=eq.${encodeURIComponent(conversationId)}`);
    if (existing && existing[0]) return existing[0];
  }

  const created = await supabaseRequest('/conversations', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      platform: 'fastwork',
      is_manual: true,
      customer_name: customerName || 'Fastwork customer',
      status: 'open',
    }),
  });
  return created[0];
}

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
  const { action, conversation_id, customer_name, content } = body || {};

  if (!content || typeof content !== 'string') {
    res.status(400).json({ error: 'content is required' });
    return;
  }
  if (action !== 'log_inbound' && action !== 'log_outbound') {
    res.status(400).json({ error: 'action must be log_inbound or log_outbound' });
    return;
  }

  try {
    const conversation = await findOrCreateFastworkConversation(customer_name, conversation_id);
    const direction = action === 'log_inbound' ? 'inbound' : 'outbound';
    const sender_type = action === 'log_inbound' ? 'customer' : 'admin';

    await supabaseRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversation.id,
        direction,
        sender_type,
        content,
      }),
    });

    await supabaseRequest(`/conversations?id=eq.${conversation.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.slice(0, 140),
        status: action === 'log_inbound' ? 'open' : 'waiting_customer',
        updated_at: new Date().toISOString(),
      }),
    });

    res.status(200).json({ ok: true, conversation_id: conversation.id });
  } catch (error) {
    console.error('fastwork-log error:', error);
    res.status(500).json({ error: 'failed to log message' });
  }
};
