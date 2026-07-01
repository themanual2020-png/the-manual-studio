# ⚡ Quick Start — 15 Minutes Setup

## 🎯 Step 1: Create Supabase Project (3 min)

1. Go to **https://supabase.com**
2. Sign up with Google → Create Organization
3. Create Project named `the-manual-studio`
4. Select Region: **Singapore** 🇸🇬
5. Set Password → Click **Create New Project**

---

## 🔧 Step 2: Get API Credentials (2 min)

While waiting for project to load:

1. Go to **Settings → API**
2. Copy these TWO values:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **Anon Public Key** (starts with `eyJ...`)

---

## 📝 Step 3: Create Database (5 min)

1. Go to **SQL Editor** (left menu)
2. Click **New Query**
3. Paste this:

```sql
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

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON projects FOR SELECT USING (true);
```

4. Click **Run** (or `Ctrl+Enter`)

---

## 🔑 Step 4: Update Config Files (2 min)

Edit **`supabase-client.js`** in your web folder:

```javascript
const SUPABASE_CONFIG = {
  URL: 'https://xxxxx.supabase.co',  // ← Paste here
  KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // ← Paste here
};
```

Edit **`admin.html`** (around line 280):

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',  // ← Paste here
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // ← Paste here
};
```

---

## ➕ Step 5: Add Sample Data (2 min)

**Option A: Via Admin Panel (Easy)**
1. Open `http://localhost:8000/admin.html`
2. Click **+ Add Project**
3. Fill in form → Click **Save Project**

**Option B: Via Supabase UI**
1. Go to **Table Editor** → **projects** table
2. Click **Insert Row**
3. Fill in data:
   ```
   project_id: sukhumvit-residence
   title: Sukhumvit Residence
   subtitle: บ้านพักอาศัย · Interior & Exterior
   type_label: Photography
   cat_label: INTERIOR & EXTERIOR
   year: 2025
   location: กรุงเทพมหานคร
   body: บ้านพักอาศัยส่วนตัวบนถนนสุขุมวิท...
   body_detail: งานภาพถ่ายสถาปัตยกรรมที่บันทึก...
   ```

---

## ✅ Step 6: Test Locally (1 min)

1. Keep server running: `python3 -m http.server 8000`
2. Open **http://localhost:8000**
3. Data should load from Supabase! 🎉

---

## 🚀 Step 7: Deploy to Netlify (GitHub required)

### 7.1 Initialize Git
```bash
cd /Users/punnathatpreyapanich/web
git init
git add .
git commit -m "Initial commit: The Manual Studio with Supabase"
```

### 7.2 Create GitHub Repo
1. Go to **https://github.com/new**
2. Create repo: `the-manual-studio`
3. Don't add README/gitignore
4. Copy repo URL

### 7.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/the-manual-studio.git
git branch -M main
git push -u origin main
```

### 7.4 Deploy to Netlify
1. Go to **https://netlify.com**
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub**
4. Authorize Netlify to GitHub
5. Select your `the-manual-studio` repo
6. Click **Deploy site**
7. Wait 1-2 minutes for deployment...

### 7.5 Add Environment Variables
1. In Netlify dashboard → **Settings** → **Build & Deploy** → **Environment**
2. Click **Add** and set:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://xxxxx.supabase.co`
3. Click **Add** again:
   - Name: `VITE_SUPABASE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Redeploy site

---

## 🎉 You're Done!

Your website is now:
- ✅ Powered by Supabase database
- ✅ Editable via admin panel
- ✅ Live on the internet
- ✅ Completely free tier

**Links to remember:**
- Admin Panel: `https://YOUR_DOMAIN.netlify.app/admin.html`
- Supabase Dashboard: `https://app.supabase.com`
- GitHub Repo: `https://github.com/YOUR_USERNAME/the-manual-studio`

---

## 🔗 Useful Links

- **Supabase Status**: https://status.supabase.com
- **Netlify Docs**: https://docs.netlify.com
- **Help & Support**: Contact support in respective dashboards

---

## 💬 Troubleshooting

**Q: "API connection failed" in admin panel?**
A: Check `CONFIG.SUPABASE_URL` and `CONFIG.SUPABASE_KEY` are correct (no typos!)

**Q: Data not showing on homepage?**
A: Make sure you added at least 1 project in Supabase. Check browser console for errors.

**Q: Deploy failed on Netlify?**
A: Check build logs. Usually missing `package.json` or env vars not set.

**Q: Can I use custom domain?**
A: Yes! Netlify has free SSL. Go to **Site settings → Domain management**

---

**Questions? Need help? 📞**

Check:
1. Supabase Docs: https://supabase.com/docs
2. Netlify Docs: https://docs.netlify.com
3. Repo Issues: GitHub repo issues section
