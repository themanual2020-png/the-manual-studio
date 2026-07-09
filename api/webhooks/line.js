const { verifySignature, getProfile } = require('../../lib/line/client');
const { supabaseRequest } = require('../../lib/supabase/service-client');

// LINE signs the raw request body, so auto body-parsing must be disabled —
// re-serializing a parsed object would not byte-for-byte match what LINE signed.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function findOrCreateConversation(userId) {
  const existing = await supabaseRequest(
    `/conversations?platform=eq.line&platform_thread_id=eq.${encodeURIComponent(userId)}`
  );
  if (existing && existing[0]) return existing[0];

  const profile = await getProfile(userId).catch(() => null);
  const created = await supabaseRequest('/conversations', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      platform: 'line',
      platform_thread_id: userId,
      customer_name: (profile && profile.displayName) || 'LINE user',
      customer_avatar_url: (profile && profile.pictureUrl) || null,
      status: 'open',
    }),
  });
  return created[0];
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const rawBody = await readRawBody(req);

  let valid = false;
  try {
    valid = verifySignature(rawBody, req.headers['x-line-signature']);
  } catch (error) {
    console.error('line webhook signature check failed:', error);
  }
  if (!valid) {
    res.status(401).json({ error: 'invalid signature' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'invalid json' });
    return;
  }

  const events = Array.isArray(payload.events) ? payload.events : [];

  for (const event of events) {
    if (event.type !== 'message' || !event.message || event.message.type !== 'text') continue;
    const userId = event.source && event.source.userId;
    if (!userId) continue;

    try {
      const existingMsg = await supabaseRequest(
        `/messages?platform_message_id=eq.${encodeURIComponent(event.message.id)}&select=id`
      );
      if (existingMsg && existingMsg.length > 0) continue; // already processed (webhook retry)

      const conversation = await findOrCreateConversation(userId);

      await supabaseRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: conversation.id,
          direction: 'inbound',
          sender_type: 'customer',
          platform_message_id: event.message.id,
          content: event.message.text,
        }),
      });

      await supabaseRequest(`/conversations?id=eq.${conversation.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          last_message_at: new Date(event.timestamp || Date.now()).toISOString(),
          last_message_preview: event.message.text.slice(0, 140),
          unread_count: (conversation.unread_count || 0) + 1,
          status: 'open',
          updated_at: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('line webhook processing error:', error);
    }
  }

  res.status(200).json({ ok: true });
};
