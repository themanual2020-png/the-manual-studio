// Session-gated CRUD for internal admin tables (job_queue, saved_items),
// plus a Gemini-powered link-summarize helper for the archive page (reads
// the target page server-side, asks Gemini for a title/summary/tags).
// Both tables have zero RLS policies — only the service role key (used
// here, server-side only) can touch them at all. Kept as one function
// (switched via ?resource= / ?action=) to stay under Vercel Hobby's
// 12-function cap — see api/admin/projects.js for the same pattern with
// ?action=reorder.
const { requireSession } = require('../../lib/auth/verify-session');

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';
const GEMINI_MODEL = 'gemini-3.6-flash';

const RESOURCES = {
  'job-queue': { table: 'job_queue', order: 'date.asc' },
  'saved-items': { table: 'saved_items', order: 'created_at.desc' },
};

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeta(html, name) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`,
    'i'
  );
  const match = html.match(re);
  return match ? match[1].trim() : '';
}

const FACEBOOK_HOSTS = ['facebook.com', 'fb.watch', 'fb.com'];
// Facebook (and some other platforms) serve richer Open Graph data to their
// own known crawler UA — the same one Messenger/WhatsApp use to build link
// previews — than to a generic browser UA when the viewer isn't logged in.
const FACEBOOK_CRAWLER_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const DEFAULT_UA = 'Mozilla/5.0 (compatible; ArchiveBot/1.0)';

// Meta serves this boilerplate on posts it won't render without login —
// catch it so we don't silently save "you must log in" as if it were the
// real post content.
const LOGIN_WALL_PATTERN = /log\s?in to (facebook|continue)|เข้าสู่ระบบ.*facebook|เข้าร่วม facebook หรือเข้าสู่ระบบ/i;

function isFacebookUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return FACEBOOK_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  } catch {
    return false;
  }
}

async function handleSummarizeLink(req, res) {
  const url = req.body && req.body.url;
  if (!url || !/^https?:\/\//i.test(url)) {
    res.status(400).json({ error: 'invalid url' });
    return;
  }

  let pageText = '';
  let fallbackTitle = '';
  let ogDescription = '';
  let imageUrl = '';
  try {
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': isFacebookUrl(url) ? FACEBOOK_CRAWLER_UA : DEFAULT_UA },
      signal: AbortSignal.timeout(8000),
    });
    const html = await pageRes.text();
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    fallbackTitle = extractMeta(html, 'og:title') || (titleMatch ? titleMatch[1].trim() : '');
    ogDescription = extractMeta(html, 'og:description');
    pageText = htmlToText(html).slice(0, 6000);

    const rawImage = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');
    if (rawImage) {
      try {
        imageUrl = new URL(rawImage, url).href;
      } catch {
        imageUrl = '';
      }
    }
  } catch (e) {
    res.status(502).json({ error: 'ดึงหน้าเว็บไม่สำเร็จ: ' + e.message });
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
    return;
  }

  try {
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `สรุปหน้าเว็บนี้เป็นภาษาไทย สั้น กระชับ สำหรับเก็บไว้อ้างอิงภายหลัง\n\nURL: ${url}\nTitle tag (og:title ก่อน ถ้าไม่มีใช้ <title>): ${fallbackTitle}\nog:description: ${ogDescription}\nเนื้อหาที่ดึงได้จากหน้าเว็บ:\n${pageText}\n\nถ้าเนื้อหาข้างต้นเป็นแค่หน้าล็อกอิน/ขอสิทธิ์เข้าถึง ไม่ใช่เนื้อหาโพสต์จริง ให้ตั้ง summary เริ่มด้วย "[ต้องเข้าสู่ระบบ]" แล้วอธิบายว่าดึงเนื้อหาจริงไม่ได้\n\nส่งกลับ title (หัวข้อสั้นๆ ไม่เกิน 15 คำ), summary (สรุป 1-2 ประโยค), tags (3-5 คำสำคัญภาษาไทย)`,
            }],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              },
              required: ['title', 'summary', 'tags'],
            },
          },
        }),
      }
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      res.status(502).json({ error: 'เรียก Gemini ไม่สำเร็จ: ' + errText });
      return;
    }

    const aiData = await aiRes.json();
    const candidate = aiData.candidates && aiData.candidates[0];
    const text = candidate && candidate.content && candidate.content.parts
      && candidate.content.parts[0] && candidate.content.parts[0].text;
    const parsed = text ? JSON.parse(text) : null;
    if (!parsed) {
      res.status(502).json({ error: 'Gemini ไม่ได้ส่งผลลัพธ์กลับมา' });
      return;
    }

    const combined = `${parsed.title || ''} ${parsed.summary || ''}`;
    const loginWallDetected = LOGIN_WALL_PATTERN.test(combined) || parsed.summary?.startsWith('[ต้องเข้าสู่ระบบ]');

    res.status(200).json({
      title: parsed.title || fallbackTitle || url,
      note: parsed.summary || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      image: imageUrl,
      loginWallDetected,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function handleBulkImportSavedItems(req, res, key) {
  const items = req.body && req.body.items;
  if (!Array.isArray(items) || !items.length) {
    res.status(400).json({ error: 'items must be a non-empty array' });
    return;
  }
  if (items.length > 500) {
    res.status(400).json({ error: 'นำเข้าได้ครั้งละไม่เกิน 500 รายการ' });
    return;
  }

  const rows = items
    .map((item) => ({
      source_type: item.source_type || 'other',
      url: item.url || null,
      title: String(item.title || item.url || '').slice(0, 500),
      note: item.note || null,
      tags: Array.isArray(item.tags) ? item.tags : [],
    }))
    .filter((row) => row.title);

  if (!rows.length) {
    res.status(400).json({ error: 'ไม่มีรายการที่ใช้ได้ (ต้องมีหัวข้อหรือลิงก์)' });
    return;
  }

  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/saved_items`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(rows),
    });
    if (!r.ok) {
      const errText = await r.text();
      res.status(r.status).json({ error: errText });
      return;
    }
    res.status(200).json({ imported: rows.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;

  if (req.method === 'POST' && req.query.action === 'summarize-link') {
    await handleSummarizeLink(req, res);
    return;
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set' });
    return;
  }

  if (req.method === 'POST' && req.query.action === 'bulk-import-saved-items') {
    await handleBulkImportSavedItems(req, res, key);
    return;
  }

  const { id, resource } = req.query;
  const { table, order } = RESOURCES[resource] || RESOURCES['job-queue'];
  const method = req.method;
  let path = `/rest/v1/${table}`;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  if (method === 'GET') {
    path += `?select=*&order=${order}`;
  } else if (method === 'POST') {
    headers.Prefer = 'return=representation';
  } else if (method === 'PATCH' || method === 'DELETE') {
    if (!id) {
      res.status(400).json({ error: 'missing id' });
      return;
    }
    path += `?id=eq.${encodeURIComponent(id)}`;
    if (method === 'PATCH') headers.Prefer = 'return=representation';
  } else {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    const r = await fetch(`${SUPA_URL}${path}`, {
      method,
      headers,
      body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(req.body),
    });
    const text = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text || '{}');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
