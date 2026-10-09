// อ่าน-เขียนข้อมูลของระบบ "ออฟฟิศทีม AI" ทุกตารางผ่านฟังก์ชันเดียว
// (Vercel Hobby จำกัด 12 Serverless Functions ดู ai-office-handoff/HANDOFF.md)
//
//   GET    /api/admin/office?table=ledger&from=2026-09-01&to=2026-09-30
//   POST   /api/admin/office?table=ledger          body = row หรือ array ของ row
//   PATCH  /api/admin/office?table=ledger&id=...   body = ฟิลด์ที่จะแก้
//   DELETE /api/admin/office?table=ledger&id=...
//
// ตารางเหล่านี้เปิด RLS โดยไม่มี policy เลย แตะได้เฉพาะ service role key
// ซึ่งอยู่ฝั่ง server เท่านั้น และทุก request ต้องมี session ของ admin
const { requireSession } = require('../../lib/auth/verify-session');

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';
const MAX_LIMIT = 1000;

// ชื่อตารางและคอลัมน์ที่กรองได้ต้องมาจากตารางนี้เท่านั้น ห้ามรับค่าดิบจาก client
// ไปต่อใน query string ตรงๆ เพราะเปิดช่องให้ยิงตารางอื่นหรือแทรกเงื่อนไขได้
const TABLES = {
  office_tasks: {
    pk: 'id',
    order: 'created_at.desc',
    filters: { dept: 'eq', status: 'eq', mode: 'eq' },
  },
  ledger: {
    pk: 'id',
    order: 'date.desc',
    filters: { kind: 'eq', category: 'eq', source: 'eq' },
    range: 'date', // ?from= / ?to= กรองคอลัมน์นี้
  },
  work_projects: {
    pk: 'id',
    order: 'due.asc.nullslast',
    filters: { status: 'eq', type: 'eq' },
  },
  office_settings: {
    pk: 'key',
    order: 'key.asc',
    filters: { key: 'eq' },
    upsert: true, // POST = upsert ตาม key
  },
};

// PostgREST ตีความอักขระพวก , . ( ) เป็นไวยากรณ์ จึงต้องกันค่าที่ส่งมาแปลกๆ
// ก่อนนำไปต่อใน query string
function isSafeValue(v) {
  return typeof v === 'string' && v.length <= 200 && !/[,()"\\]/.test(v);
}

function buildListQuery(spec, query) {
  const parts = ['select=*'];

  for (const [col, op] of Object.entries(spec.filters || {})) {
    const raw = query[col];
    if (raw === undefined) continue;
    if (!isSafeValue(raw)) return { error: `ค่าของ ${col} ไม่ถูกต้อง` };
    parts.push(`${col}=${op}.${encodeURIComponent(raw)}`);
  }

  if (spec.range) {
    if (query.from !== undefined) {
      if (!isSafeValue(query.from)) return { error: 'ค่า from ไม่ถูกต้อง' };
      parts.push(`${spec.range}=gte.${encodeURIComponent(query.from)}`);
    }
    if (query.to !== undefined) {
      if (!isSafeValue(query.to)) return { error: 'ค่า to ไม่ถูกต้อง' };
      parts.push(`${spec.range}=lte.${encodeURIComponent(query.to)}`);
    }
  }

  parts.push(`order=${spec.order}`);

  const limit = Math.min(parseInt(query.limit, 10) || MAX_LIMIT, MAX_LIMIT);
  parts.push(`limit=${limit}`);

  return { qs: parts.join('&') };
}

module.exports = async function handler(req, res) {
  if (!requireSession(req, res)) return;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set' });
    return;
  }

  const query = req.query || {};
  const table = query.table;
  const spec = Object.prototype.hasOwnProperty.call(TABLES, table) ? TABLES[table] : null;
  if (!spec) {
    res.status(400).json({ error: 'ไม่รู้จักตารางนี้' });
    return;
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  let path;
  const method = req.method;
  let body;

  if (method === 'GET') {
    const built = buildListQuery(spec, query);
    if (built.error) {
      res.status(400).json({ error: built.error });
      return;
    }
    path = `/rest/v1/${table}?${built.qs}`;
  } else if (method === 'POST') {
    path = `/rest/v1/${table}`;
    headers.Prefer = spec.upsert
      ? 'return=representation,resolution=merge-duplicates'
      : 'return=representation';
    body = JSON.stringify(req.body);
  } else if (method === 'PATCH' || method === 'DELETE') {
    const id = query.id;
    if (!isSafeValue(id)) {
      res.status(400).json({ error: 'ต้องระบุ id' });
      return;
    }
    path = `/rest/v1/${table}?${spec.pk}=eq.${encodeURIComponent(id)}`;
    if (method === 'PATCH') {
      headers.Prefer = 'return=representation';
      body = JSON.stringify(req.body);
    }
  } else {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    const r = await fetch(`${SUPA_URL}${path}`, { method, headers, body });
    const text = await r.text();
    res.status(r.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text || '{}');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
