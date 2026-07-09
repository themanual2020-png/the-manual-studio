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

async function fetchMe(fields, accessToken) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
  );
  if (!res.ok) return null;
  return res.json();
}

// Best-effort enrichment only (page display name + linked IG account) —
// never throws. Tokens generated via the Messenger API Settings "Generate
// Token" flow are scoped narrowly and often can't read even `id` back via
// `/me` without extra Page permissions/feature review, so the page_id itself
// is supplied directly by the admin (visible in the Meta console) rather
// than relying on this call to succeed.
async function lookupPageDetails(accessToken) {
  const full = await fetchMe('name,instagram_business_account{id,name}', accessToken);
  if (full) {
    return {
      page_name: full.name || null,
      ig_account_id: (full.instagram_business_account && full.instagram_business_account.id) || null,
    };
  }
  return { page_name: null, ig_account_id: null };
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

module.exports = { verifySignature, lookupPageDetails, getProfile, sendMessage };
