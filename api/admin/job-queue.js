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

async function handleSummarizeLink(req, res) {
  const url = req.body && req.body.url;
  if (!url || !/^https?:\/\//i.test(url)) {
    res.status(400).json({ error: 'invalid url' });
    return;
  }

  let pageText = '';
  let fallbackTitle = '';
  try {
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ArchiveBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await pageRes.text();
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    fallbackTitle = titleMatch ? titleMatch[1].trim() : '';
    pageText = htmlToText(html).slice(0, 6000);
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
              text: `สรุปหน้าเว็บนี้เป็นภาษาไทย สั้น กระชับ สำหรับเก็บไว้อ้างอิงภายหลัง\n\nURL: ${url}\nTitle tag: ${fallbackTitle}\nเนื้อหา:\n${pageText}\n\nส่งกลับ title (หัวข้อสั้นๆ ไม่เกิน 15 คำ), summary (สรุป 1-2 ประโยค), tags (3-5 คำสำคัญภาษาไทย)`,
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

    res.status(200).json({
      title: parsed.title || fallbackTitle || url,
      note: parsed.summary || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    });
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
