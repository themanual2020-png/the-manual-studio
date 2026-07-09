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

// Identifies which Page a token belongs to (and its linked IG account, if
// any) so the admin only has to paste a token — no manual ID lookups.
// `name` and `instagram_business_account` need extra Page permissions
// (pages_read_engagement / feature review) that may not be granted yet in
// Development mode, so this degrades gracefully field-by-field rather than
// failing registration outright — `id` alone is always readable from a
// valid Page token and is all that's strictly required to route messages.
async function registerPage(accessToken) {
  const full = await fetchMe('id,name,instagram_business_account{id,name}', accessToken);
  if (full) {
    return {
      page_id: full.id,
      page_name: full.name || null,
      ig_account_id: (full.instagram_business_account && full.instagram_business_account.id) || null,
    };
  }

  const nameOnly = await fetchMe('id,name', accessToken);
  if (nameOnly) {
    return { page_id: nameOnly.id, page_name: nameOnly.name || null, ig_account_id: null };
  }

  const idOnly = await fetchMe('id', accessToken);
  if (idOnly) {
    return { page_id: idOnly.id, page_name: null, ig_account_id: null };
  }

  throw new Error('Meta me API: could not read Page identity with this token (check it is a valid Page Access Token)');
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
