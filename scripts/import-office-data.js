#!/usr/bin/env node
// นำเข้าข้อมูลจากต้นแบบ "ออฟฟิศทีม AI" บน claude.ai เข้าฐานข้อมูลจริง (ครั้งเดียว)
//
// วิธีใช้ — ต้องรัน SQL ใน sql/001_ai_office.sql ให้เสร็จก่อน:
//
//   SUPABASE_SERVICE_ROLE_KEY='...' node scripts/import-office-data.js
//
// หาคีย์ได้ที่ Supabase → Settings → API → service_role (secret)
// อย่าใส่คีย์ลงในไฟล์หรือ commit ขึ้น git เด็ดขาด
//
// เสร็จแล้วให้ลบ ai-office-handoff/data/ ทิ้ง — ในไฟล์มีชื่อบุคคลและรายการโอนเงินจริง
const fs = require('fs');
const path = require('path');

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';
const DATA_FILE = path.join(__dirname, '..', 'ai-office-handoff', 'data', 'data-export.json');

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
  console.error('✗ ต้องตั้ง SUPABASE_SERVICE_ROLE_KEY ก่อน');
  console.error("  ตัวอย่าง: SUPABASE_SERVICE_ROLE_KEY='...' node scripts/import-office-data.js");
  process.exit(1);
}

if (!fs.existsSync(DATA_FILE)) {
  console.error(`✗ ไม่พบไฟล์ ${DATA_FILE}`);
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

async function count(table) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${table}?select=id&limit=1`, { headers });
  if (!r.ok) throw new Error(`อ่านตาราง ${table} ไม่ได้ (${r.status}) — รัน sql/001_ai_office.sql แล้วหรือยัง?`);
  const rows = await r.json();
  return Array.isArray(rows) ? rows.length : 0;
}

async function insert(table, rows, { upsert = false } = {}) {
  if (!rows.length) return 0;
  const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: upsert ? 'return=minimal,resolution=merge-duplicates' : 'return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`เขียน ${table} ไม่สำเร็จ (${r.status}): ${await r.text()}`);
  return rows.length;
}

const iso = (ms) => (ms ? new Date(ms).toISOString() : undefined);

(async () => {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const c = raw.collections || {};

  console.log(`\nไฟล์ส่งออกเมื่อ: ${raw.exportedAt}`);
  console.log(
    `พบข้อมูล: ledger ${(c.ledger || []).length} · tasks ${(c.tasks || []).length} · ` +
      `settings ${(c.settings || []).length} · projects ${(c.projects || []).length} · ptasks ${(c.ptasks || []).length}\n`
  );

  // กันนำเข้าซ้ำ — ถ้ามีข้อมูลอยู่แล้วให้หยุด ไม่งั้นบัญชีจะเบิ้ล
  for (const t of ['ledger', 'office_tasks']) {
    if ((await count(t)) > 0) {
      console.error(`✗ ตาราง ${t} มีข้อมูลอยู่แล้ว — ดูเหมือนเคยนำเข้าไปรอบหนึ่งแล้ว`);
      console.error('  ถ้าต้องการนำเข้าใหม่ ให้ลบข้อมูลเดิมออกก่อนด้วยตัวเอง');
      process.exit(1);
    }
  }

  const ledger = (c.ledger || []).map((r) => ({
    date: r.date,
    kind: r.kind,
    amount: Math.abs(Number(r.amount) || 0),
    category: r.category || null,
    merchant: r.merchant || null,
    note: r.note || null,
    source: r.source || 'manual',
    created_by: 'imported',
    created_at: iso(r.createdAt),
  }));

  const tasks = (c.tasks || []).map((t) => ({
    dept: t.dept,
    mode: t.mode || null,
    title: t.title || null,
    status: t.status || 'done',
    steps: Array.isArray(t.steps) ? t.steps : [],
    result: t.result ?? null,
    error: t.error || null,
    review: t.review ?? null,
    created_by: 'imported',
    created_at: iso(t.createdAt),
  }));

  const workProjects = (c.projects || []).map((p) => ({
    name: p.name,
    type: p.type || 'client',
    client: p.client || null,
    due: p.due || null,
    brief: p.brief || null,
    status: p.status || 'active',
    created_by: 'imported',
    created_at: iso(p.createdAt),
  }));

  // settings ในต้นแบบเก็บเป็นหลาย document (catmap, brand, categories, sites)
  // ย้ายมาเป็นตาราง key-value ตัวเดียว โดยตัด id ออกจาก value
  const settings = (c.settings || []).map((s) => {
    const { id, ...value } = s;
    return { key: id, value };
  });

  const n1 = await insert('ledger', ledger);
  console.log(`✓ ledger          ${n1} รายการ`);

  const n2 = await insert('office_tasks', tasks);
  console.log(`✓ office_tasks    ${n2} รายการ`);

  const n3 = await insert('work_projects', workProjects);
  console.log(`✓ work_projects   ${n3} รายการ`);

  const n4 = await insert('office_settings', settings, { upsert: true });
  console.log(`✓ office_settings ${n4} รายการ (${settings.map((s) => s.key).join(', ')})`);

  const income = ledger.filter((r) => r.kind === 'income').reduce((a, r) => a + r.amount, 0);
  const expense = ledger.filter((r) => r.kind === 'expense').reduce((a, r) => a + r.amount, 0);
  const fmt = (n) => n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  console.log(`\nยอดรวมที่นำเข้า — เงินเข้า ฿${fmt(income)} · เงินออก ฿${fmt(expense)}`);
  console.log('เทียบกับ HANDOFF: เงินเข้า ฿292,917.50 · เงินออก ฿123,936.82');
  console.log('\n⚠️  นำเข้าเสร็จแล้วให้ลบ ai-office-handoff/data/ ทิ้ง (มีข้อมูลการเงินจริง)\n');
})().catch((e) => {
  console.error(`\n✗ ${e.message}\n`);
  process.exit(1);
});
