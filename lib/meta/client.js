// Meta Graph API helpers, shared by the Facebook/Instagram webhook receiver
// and the inbox UI's manual-reply send path.
//
// Unlike LINE (one OA = one channel token), a business can run multiple FB
// Pages (each with its own Page Access Token) feeding the same inbox, and
// each Page may have its own linked Instagram Business Account. So there is
// no single global page token here — callers look up the right token per
// page/conversation (see meta_pages table) and pass it in explicitly.
const crypto = require('crypto');

function verifySignature(rawBody, signatureHeader) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) throw new Error('META_APP_SECRET is not set');
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const expectedBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== sigBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}

// Identifies which Page a token belongs to (and its linked IG account, if
// any) so the admin only has to paste a token — no manual ID lookups.
async function registerPage(accessToken) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me?fields=id,name,instagram_business_account{id,name}&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Meta me API ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return {
    page_id: data.id,
    page_name: data.name,
    ig_account_id: (data.instagram_business_account && data.instagram_business_account.id) || null,
  };
}

async function getProfile(userId, accessToken) {
  if (!accessToken) return null;
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(userId)}?fields=first_name,last_name,profile_pic&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!res.ok) return null;
  return res.json();
}

async function sendMessage(recipientId, text, accessToken) {
  const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Meta send API ${res.status}: ${errText}`);
  }
}

module.exports = { verifySignature, registerPage, getProfile, sendMessage };
