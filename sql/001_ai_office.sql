-- ออฟฟิศทีม AI — ตารางพื้นฐาน (เฟส 1)
-- ที่มา: ai-office-handoff/HANDOFF.md หัวข้อ 5
--
-- ทุกตารางเปิด RLS แต่ "ไม่สร้าง policy เลย" แปลว่า anon key แตะไม่ได้
-- เข้าถึงได้เฉพาะ service role ผ่าน api/admin/* เท่านั้น
-- (รูปแบบเดียวกับ job_queue และ login_attempts ที่ใช้อยู่)

-- ───────────────────────────────────────────────
-- งานของทีม AI ทุกห้อง
-- ───────────────────────────────────────────────
create table if not exists office_tasks (
  id          uuid primary key default gen_random_uuid(),
  dept        text not null,                       -- pm | marketing | content | finance | it
  mode        text,                                -- โหมดงาน เช่น ads, stmt, plan, page
  title       text,
  status      text not null default 'running',     -- running | done | error
  steps       jsonb not null default '[]'::jsonb,  -- [{agent, text}] บันทึกทุกขั้นที่ agent ทำ
  result      jsonb,                               -- รูปแบบต่างกันตาม kind ดู HANDOFF หัวข้อ 5
  error       text,
  review      jsonb,                               -- ผลตรวจจาก PM {verdict, note, issues[], at}
  created_by  text,                                -- ผู้ใช้ admin (ตอนนี้มีคนเดียว)
  created_at  timestamptz not null default now()
);

create index if not exists office_tasks_dept_created_idx
  on office_tasks (dept, created_at desc);
create index if not exists office_tasks_status_idx
  on office_tasks (status);

alter table office_tasks enable row level security;

-- ───────────────────────────────────────────────
-- สมุดบัญชี
-- ───────────────────────────────────────────────
create table if not exists ledger (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  kind        text not null,                       -- income | expense
  amount      numeric(14,2) not null check (amount >= 0),  -- เก็บเป็นบวกเสมอ ทิศทางดูที่ kind
  category    text,
  merchant    text,                                -- รายละเอียด / คู่โอน
  note        text,                                -- เช่น "ธนาคารกสิกรไทย 9634"
  source      text,                                -- stmt | slips | manual
  created_by  text,
  created_at  timestamptz not null default now()
);

-- รายงานรายเดือนกรองตามช่วงวันที่เป็นหลัก
create index if not exists ledger_date_idx on ledger (date desc);
create index if not exists ledger_kind_date_idx on ledger (kind, date desc);

alter table ledger enable row level security;

-- ───────────────────────────────────────────────
-- โปรเจกต์งานภายใน
-- หมายเหตุ: ตั้งชื่อ work_projects เพื่อไม่ให้ชนกับตาราง projects
--           ที่เป็น "ผลงาน" แสดงบนเว็บสาธารณะ
-- ───────────────────────────────────────────────
create table if not exists work_projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null default 'client',      -- client | internal
  client      text,
  due         date,
  brief       text,
  status      text not null default 'active',      -- active | hold | done
  created_by  text,
  created_at  timestamptz not null default now()
);

create index if not exists work_projects_status_idx on work_projects (status, due);

alter table work_projects enable row level security;

-- ───────────────────────────────────────────────
-- ตั้งค่าของระบบออฟฟิศ (key-value)
-- key ที่ใช้: brand | categories | catmap | sites
-- ───────────────────────────────────────────────
create table if not exists office_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table office_settings enable row level security;

-- ───────────────────────────────────────────────
-- บันทึกการเรียก Claude API (ไว้คุมค่าใช้จ่าย + จำกัดจำนวนครั้ง)
-- HANDOFF หัวข้อ 4: "ควรมี rate limit ต่อผู้ใช้และบันทึกการใช้งาน"
-- ───────────────────────────────────────────────
create table if not exists ai_usage (
  id             uuid primary key default gen_random_uuid(),
  dept           text,
  mode           text,
  model          text,
  input_tokens   integer,
  output_tokens  integer,
  ok             boolean not null default true,
  error          text,
  created_by     text,
  created_at     timestamptz not null default now()
);

-- นับจำนวนครั้งในช่วงเวลาที่ผ่านมาเพื่อทำ rate limit
create index if not exists ai_usage_created_idx on ai_usage (created_at desc);

alter table ai_usage enable row level security;

-- ───────────────────────────────────────────────
-- ต่อยอด job_queue เดิมให้ทำหน้าที่ ptasks
-- (job_queue มีแท็ก ผู้รับผิดชอบ ความสำคัญ งานย่อย คัมบัง ครบอยู่แล้ว
--  จึงไม่สร้างตารางใหม่ซ้ำซ้อน)
-- ───────────────────────────────────────────────
alter table job_queue
  add column if not exists work_project_id uuid references work_projects(id) on delete set null;

create index if not exists job_queue_work_project_idx
  on job_queue (work_project_id);
