// Meta Graph API helpers, shared by the Facebook/Instagram webhook receiver
// and the inbox UI's manual-reply send path. One Page Access Token covers
// both FB Messenger and Instagram DMs once IG is linked as the Page's
// connected Business account.
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

function getPageAccessToken() {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN is not set');
  return token;
}

async function getProfile(userId) {
  const token = getPageAccessToken();
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(userId)}?fields=first_name,last_name,profile_pic&access_token=${encodeURIComponent(token)}`
  );
  if (!res.ok) return null;
  return res.json();
}

async function sendMessage(recipientId, text) {
  const token = getPageAccessToken();
  const res = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Meta send API ${res.status}: ${errText}`);
  }
}

module.exports = { verifySignature, getPageAccessToken, getProfile, sendMessage };
