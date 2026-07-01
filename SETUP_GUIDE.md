# 🚀 The Manual Studio — Supabase + Netlify Setup Guide

## ขั้นตอนที่ 1️⃣: สร้าง Supabase Account (5 นาที)

### Step 1.1: สร้าง Account
1. ไปที่ https://supabase.com
2. Click **"Sign Up"** → ใช้ Google account
3. สร้าง Organization: `the-manual-studio`
4. สร้าง Project: `the-manual-studio`
5. เลือก Region: **Singapore** (ใกล้สุด)
6. ตั้ง Password แล้ว Click **Create New Project**
7. รอ 1-2 นาที...

### Step 1.2: Copy Connection Details
เข้า Project แล้วไปที่ **Settings → Database**
- Copy `Project URL` (เช่น `https://xxxxx.supabase.co`)
- Copy `Project API Key` (anon public key)

---

## ขั้นตอนที่ 2️⃣: สร้าง Database Schema

ไปที่ **SQL Editor** → Paste โค้ดนี้:

```sql
-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  type_label TEXT NOT NULL,
  cat_label TEXT NOT NULL,
  year TEXT NOT NULL,
  location TEXT NOT NULL,
  body TEXT NOT NULL,
  body_detail TEXT NOT NULL,
  hero_placeholder TEXT,
  hero_image_url TEXT,
  gallery_1_url TEXT,
  gallery_2_url TEXT,
  gallery_3_url TEXT,
  gallery_4_url TEXT,
  gallery_5_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - อนุญาตทุกคนอ่าน
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON projects
  FOR SELECT USING (true);

-- Create admin credentials table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

Click **Run** → จะเห็น 2 tables ใหม่ใน **Table Editor**

---

## ขั้นตอนที่ 3️⃣: เพิ่มข้อมูล Sample

ไปที่ **Table Editor** → เลือก **projects** → **Insert Row**

เพิ่มข้อมูล 3-5 projects นี้:

```json
{
  "project_id": "sukhumvit-residence",
  "title": "Sukhumvit Residence",
  "subtitle": "บ้านพักอาศัย · Interior & Exterior",
  "type_label": "Photography",
  "cat_label": "INTERIOR & EXTERIOR",
  "year": "2025",
  "location": "กรุงเทพมหานคร",
  "body": "บ้านพักอาศัยส่วนตัวบนถนนสุขุมวิท ที่ผสมผสานความเป็นส่วนตัวและความทันสมัยไว้ด้วยกัน",
  "body_detail": "งานภาพถ่ายสถาปัตยกรรมที่บันทึกทั้งพื้นที่ภายในและภายนอก ให้ครบถ้วนทุกมุมมอง ด้วยแสงธรรมชาติและการจัดฉากที่ละเอียดอ่อน",
  "hero_placeholder": "Sukhumvit Residence — hero"
}
```

**วนซ้ำสำหรับ projects อื่นๆ ด้วย**

---

## ขั้นตอนที่ 4️⃣: สร้าง Admin Panel

ตัวเองจะสร้างให้ในไฟล์ `admin.html` ที่:
- ✅ ดึง projects จาก Supabase
- ✅ เพิ่ม/แก้ไข/ลบ projects
- ✅ Upload รูปภาพ
- ✅ ใช้ localStorage สำหรับ auth ชั่วคราว

---

## ขั้นตอนที่ 5️⃣: Update Frontend

ไฟล์ `index.html`, `project.html` จะ:
- ✅ Fetch projects จาก Supabase API
- ✅ ไม่ hardcode ข้อมูล
- ✅ Real-time updates

---

## ขั้นตอนที่ 6️⃣: Deploy ไป Netlify

### Step 6.1: Setup Git
```bash
cd /Users/punnathatpreyapanich/web
git init
git add .
git commit -m "Initial commit"
```

### Step 6.2: Push ไป GitHub
1. สร้าง repo ที่ github.com: `the-manual-studio`
2. Push code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/the-manual-studio.git
git branch -M main
git push -u origin main
```

### Step 6.3: Deploy ผ่าน Netlify
1. ไปที่ https://netlify.com
2. Click **"Add new site"** → **Import an existing project**
3. เลือก **GitHub** → authorize → เลือก repo
4. Click **Deploy**
5. ตั้ง env vars:
   - `VITE_SUPABASE_URL`: https://xxxxx.supabase.co
   - `VITE_SUPABASE_KEY`: your_anon_key

---

## 🔐 ข้อมูล API ที่ต้องเก็บ

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Checklist

- [ ] Supabase account สร้างแล้ว
- [ ] Database schema สร้างแล้ว
- [ ] ข้อมูล sample เพิ่มแล้ว
- [ ] Admin panel ทำเสร็จ
- [ ] Frontend update เสร็จ
- [ ] Git repo สร้างแล้ว
- [ ] Deploy ไป Netlify เสร็จ
- [ ] Domain setup (optional)

---

## 🆘 Troubleshooting

**Q: ข้อมูลไม่แสดงใน frontend?**
A: ตรวจสอบ SUPABASE_URL และ SUPABASE_KEY ถูกต้องไหม

**Q: Admin panel ล็อคอินไม่ได้?**
A: ใช้ localStorage ทดสอบก่อน (ไม่มี real auth ในเวอร์ชันแรก)

**Q: Deploy ผิดพลาด?**
A: ตรวจสอบ env vars ใน Netlify Settings

---

**ทำแบบขั้นตอนนี้แล้ว คุณก็มีเว็บไซต์ที่ใช้งานได้แล้ว! 🎉**
