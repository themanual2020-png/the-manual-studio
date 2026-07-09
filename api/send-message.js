const { requireSession } = require('../lib/auth/verify-session');
const { supabaseRequest } = require('../lib/supabase/service-client');
const { pushMessage } = require('../lib/line/client');
const { sendMessage: sendMetaMessage } = require('../lib/meta/client');

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
  const { conversation_id, content } = body || {};
  if (!conversation_id || !content || typeof content !== 'string') {
    res.status(400).json({ error: 'conversation_id and content are required' });
    return;
  }

  try {
    const rows = await supabaseRequest(`/conversations?id=eq.${encodeURIComponent(conversation_id)}`);
    const conversation = rows && rows[0];
    if (!conversation) {
      res.status(404).json({ error: 'conversation not found' });
      return;
    }

    if (conversation.platform === 'line') {
      await pushMessage(conversation.platform_thread_id, content);
    } else if (conversation.platform === 'facebook' || conversation.platform === 'instagram') {
      await sendMetaMessage(conversation.platform_thread_id, content);
    } else {
      res.status(400).json({ error: `sending not yet supported for ${conversation.platform}` });
      return;
    }

    await supabaseRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversation.id,
        direction: 'outbound',
        sender_type: 'admin',
        content,
      }),
    });

    await supabaseRequest(`/conversations?id=eq.${conversation.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.slice(0, 140),
        status: 'waiting_customer',
        unread_count: 0,
        updated_at: new Date().toISOString(),
      }),
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('send-message error:', error);
    res.status(500).json({ error: 'failed to send message' });
  }
};
