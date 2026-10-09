// เรียก Claude API ฝั่ง server ให้ระบบ "ออฟฟิศทีม AI"
//
// ต้นแบบบน claude.ai เรียกผ่าน window.claude.use("sample") ซึ่งใช้โควตาของ
// คนที่กดส่งงาน พอย้ายมา admin panel ต้องเรียกผ่าน API ของบริษัทแทน
// API key จึงต้องอยู่ฝั่ง server เท่านั้น ห้ามหลุดไปฝั่งเบราว์เซอร์เด็ดขาด
//
//   POST /api/admin/ai
//   body: {
//     prompt,              // คำสั่ง (ต้องมี)
//     system,              // system prompt (ไม่บังคับ)
//     images: [{ media_type, data }],   // base64 สำหรับอ่านสลิป/หน้า PDF
//     effort: low|medium|high,          // ค่าเริ่มต้น medium
//     max_tokens,
//     json: true,          // ขอผลเป็น JSON (ไม่ stream)
//     schema,              // JSON schema บังคับรูปแบบ (ใช้กับ json: true)
//     dept, mode           // ไว้บันทึกว่าห้องไหนใช้ไปเท่าไร
//   }
//
// ปกติจะ stream ข้อความกลับเป็น text/plain ทีละชิ้น ให้ฝั่งหน้าเว็บอ่าน
// ด้วย ReadableStream — ยกเว้นโหมด json ที่รอจนจบแล้วส่งเป็นก้อนเดียว
const { requireSession } = require('../../lib/auth/verify-session');

const AnthropicModule = require('@anthropic-ai/sdk');
const Anthropic = AnthropicModule.default || AnthropicModule;

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';

const MODEL = 'claude-opus-4-8';
const DEFAULT_MAX_TOKENS = 16000;
const HARD_MAX_TOKENS = 64000;
// กันค่า API บานปลาย — ปรับได้ด้วย env AI_DAILY_LIMIT
const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT, 10) || 300;

async function countToday(key) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const r = await fetch(
    `${SUPA_URL}/rest/v1/ai_usage?created_at=gte.${encodeURIComponent(since)}&select=id`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

async function logUsage(key, row) {
  if (!key) return;
  await fetch(`${SUPA_URL}/rest/v1/ai_usage`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  }).catch(() => {});
}

function buildContent(prompt, images) {
  if (!Array.isArray(images) || images.length === 0) return prompt;

  // รูปต้องมาก่อนข้อความ โมเดลจะอ่านได้แม่นกว่า
  const blocks = images
    .filter((img) => img && img.data && img.media_type)
    .map((img) => ({
      type: 'image',
      source: { type: 'base64', media_type: img.media_type, data: img.data },
    }));
  blocks.push({ type: 'text', text: prompt });
  return blocks;
}

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY ใน Vercel' });
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
  const { prompt, system, images, effort, json, schema, dept, mode } = body || {};

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'ต้องระบุ prompt' });
    return;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    const used = await countToday(serviceKey).catch(() => 0);
    if (used >= DAILY_LIMIT) {
      res.status(429).json({ error: `ใช้งาน AI ครบโควตาวันนี้แล้ว (${DAILY_LIMIT} ครั้ง)` });
      return;
    }
  }

  const client = new Anthropic();
  const maxTokens = Math.min(
    parseInt(body.max_tokens, 10) || DEFAULT_MAX_TOKENS,
    HARD_MAX_TOKENS
  );

  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    // ให้โมเดลตัดสินใจเองว่าต้องคิดลึกแค่ไหน — งานอ่าน Statement กับจับคู่คอลัมน์
    // ต้องการความแม่นยำ ส่วนงานเขียนคอนเทนต์ส่งมาเป็น effort: 'low' ได้
    thinking: { type: 'adaptive' },
    output_config: { effort: ['low', 'medium', 'high'].includes(effort) ? effort : 'medium' },
    messages: [{ role: 'user', content: buildContent(prompt, images) }],
  };
  if (system) params.system = system;
  if (json && schema) {
    params.output_config.format = { type: 'json_schema', schema };
  }

  const usageRow = { dept: dept || null, mode: mode || null, model: MODEL, created_by: 'admin' };

  // โหมด JSON: รอจนจบแล้วส่งก้อนเดียว ฝั่งเรียกจะได้ parse ได้เลย
  if (json) {
    try {
      const stream = client.messages.stream(params);
      const message = await stream.finalMessage();
      const text = message.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');

      await logUsage(serviceKey, {
        ...usageRow,
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
        ok: true,
      });

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(200).send(text || '{}');
    } catch (e) {
      await logUsage(serviceKey, { ...usageRow, ok: false, error: e.message });
      res.status(502).json({ error: e.message });
    }
    return;
  }

  // โหมดปกติ: stream ข้อความกลับทันทีที่โมเดลพิมพ์ออกมา
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = client.messages.stream(params);
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(event.delta.text);
      }
    }
    const message = await stream.finalMessage();
    await logUsage(serviceKey, {
      ...usageRow,
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      ok: true,
    });
    res.end();
  } catch (e) {
    await logUsage(serviceKey, { ...usageRow, ok: false, error: e.message });
    // ถ้า stream เริ่มส่งไปแล้วจะเปลี่ยน status code ไม่ได้ ต้องแนบ error ต่อท้ายแทน
    if (res.headersSent) {
      res.write(`\n\n[ERROR] ${e.message}`);
      res.end();
    } else {
      res.status(502).json({ error: e.message });
    }
  }
};
