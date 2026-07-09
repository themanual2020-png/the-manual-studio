const { verifySignature, getProfile } = require('../../lib/meta/client');
const { supabaseRequest } = require('../../lib/supabase/service-client');

// Meta signs the raw request body, so auto body-parsing must be disabled —
// re-serializing a parsed object would not byte-for-byte match what Meta signed.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function findOrCreateConversation(platform, userId) {
  const existing = await supabaseRequest(
    `/conversations?platform=eq.${platform}&platform_thread_id=eq.${encodeURIComponent(userId)}`
  );
  if (existing && existing[0]) return existing[0];

  const profile = await getProfile(userId).catch(() => null);
  const profileName = profile && (profile.first_name || profile.last_name)
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : null;

  const created = await supabaseRequest('/conversations', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      platform,
      platform_thread_id: userId,
      customer_name: profileName || (platform === 'instagram' ? 'Instagram user' : 'Facebook user'),
      customer_avatar_url: (profile && profile.profile_pic) || null,
      status: 'open',
    }),
  });
  return created[0];
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('forbidden');
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const rawBody = await readRawBody(req);

  let valid = false;
  try {
    valid = verifySignature(rawBody, req.headers['x-hub-signature-256']);
  } catch (error) {
    console.error('meta webhook signature check failed:', error);
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

  const platform = payload.object === 'instagram' ? 'instagram' : 'facebook';
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entries) {
    const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : [];
    for (const event of messagingEvents) {
      // Skip echoes of our own outbound sends and non-text events (attachments, reads, etc.)
      if (!event.message || event.message.is_echo || !event.message.text) continue;
      const senderId = event.sender && event.sender.id;
      if (!senderId) continue;

      try {
        const existingMsg = await supabaseRequest(
          `/messages?platform_message_id=eq.${encodeURIComponent(event.message.mid)}&select=id`
        );
        if (existingMsg && existingMsg.length > 0) continue; // already processed (webhook retry)

        const conversation = await findOrCreateConversation(platform, senderId);

        await supabaseRequest('/messages', {
          method: 'POST',
          body: JSON.stringify({
            conversation_id: conversation.id,
            direction: 'inbound',
            sender_type: 'customer',
            platform_message_id: event.message.mid,
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
        console.error('meta webhook processing error:', error);
      }
    }
  }

  res.status(200).json({ ok: true });
};
