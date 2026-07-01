# 🎬 The Manual Studio — Bangkok Photography & Film

A professional portfolio website for The Manual Studio, powered by **Supabase** (database) and deployed to **Netlify** (hosting).

## ✨ Features

- 📱 Fully responsive design (mobile, tablet, desktop)
- 🎨 Modern UI with smooth animations and parallax effects
- 🗄️ Dynamic content from Supabase database
- 👨‍💼 Admin panel for managing projects
- 🖼️ Image placeholder slots (drag-and-drop ready)
- 🎬 Hero video upload support
- 🔍 Project filtering by category
- ⚡ Zero-downtime updates
- 🆓 100% free tier compatible

## 🛠️ Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| **Database** | Supabase (PostgreSQL) | Free 🆓 |
| **Backend** | Supabase REST API | Free 🆓 |
| **Frontend** | HTML5 + CSS3 + Vanilla JS | Free 🆓 |
| **Hosting** | Netlify | Free 🆓 |
| **CDN** | Netlify CDN | Free 🆓 |

**Total Cost: $0/month** ✅

---

## 📁 File Structure

```
the-manual-studio/
├── index.html              # Homepage with grid view
├── about.html              # About page
├── project.html            # Project detail page (dynamic)
├── admin.html              # Admin panel for managing projects
├── supabase-client.js      # Supabase API wrapper
├── image-slot.js           # Image placeholder component
├── config.js               # Configuration (credentials)
├── assets/
│   └── logo-m.png          # Studio logo
├── SETUP_GUIDE.md          # Step-by-step setup instructions
├── QUICK_START.md          # 15-minute quick start
├── DEPLOYMENT.md           # Deployment checklist
└── README.md               # This file
```

---

## 🚀 Getting Started

### Option 1: Quick Setup (15 minutes)
Follow **[QUICK_START.md](QUICK_START.md)** for a guided 15-minute setup.

### Option 2: Detailed Setup
Follow **[SETUP_GUIDE.md](SETUP_GUIDE.md)** for detailed explanations.

### Minimum Requirements
- ✅ Supabase account (free at https://supabase.com)
- ✅ GitHub account (free at https://github.com)
- ✅ Netlify account (free at https://netlify.com)
- ✅ 15 minutes of your time

---

## 📋 API Credentials Needed

You'll need to update these files with your Supabase credentials:

### 1. `supabase-client.js` (line ~43)
```javascript
const SUPABASE_CONFIG = {
  URL: 'https://xxxxx.supabase.co',        // Your Supabase URL
  KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // Anon public key
};
```

### 2. `admin.html` (line ~280)
```javascript
const CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

Find these values in **Supabase Dashboard → Settings → API**

---

## 🎯 Project Structure in Database

Each project requires:
```
{
  project_id: "sukhumvit-residence"          // Unique identifier
  title: "Sukhumvit Residence"               // Display name
  subtitle: "บ้านพักอาศัย · Interior..."     // Category + type
  type_label: "Photography"                  // Work type
  cat_label: "INTERIOR & EXTERIOR"           // Category
  year: "2025"                               // Year completed
  location: "กรุงเทพมหานคร"                   // Location
  body: "Long description..."                // Main content
  body_detail: "Detailed description..."     // Additional details
  hero_placeholder: "Image description"      // Placeholder text
  hero_image_url: ""                         // For future image URLs
  gallery_*_url: ""                          // Gallery image URLs
}
```

---

## 🔧 Admin Panel Usage

Access the admin panel at:
```
http://localhost:8000/admin.html
https://YOUR_DOMAIN.netlify.app/admin.html
```

### Features
- ✅ View all projects
- ✅ Add new project
- ✅ Edit existing project
- ✅ Delete project
- ✅ Real-time sync to database

### Add Project via Admin Panel
1. Click **+ Add Project**
2. Fill in all fields
3. Click **Save Project**
4. Data immediately visible on homepage

---

## 🌐 Pages

### Homepage (`index.html`)
- Hero section with video upload
- Project grid with filtering
- Contact section
- Responsive mobile layout

**Features:**
- Video drag-and-drop (stored in IndexedDB)
- Category filtering (All, Interior, Event, Documentary, Presentation)
- Parallax scrolling effects
- Click project card → detail page

### Project Detail (`project.html?id=project-id`)
- Full project overview
- Hero image with parallax
- Project metadata
- Gallery grid (5 images)
- Next project navigation

**Features:**
- Dynamic content based on URL parameter
- Auto-cycling through all projects
- Responsive gallery layout

### About (`about.html`)
- Studio description
- Services list
- Team mission
- Contact CTA

### Admin Panel (`admin.html`)
- Project CRUD operations
- Supabase connection status
- Form validation
- Success/error alerts

---

## 📊 Database Schema

Created via SQL in Supabase:

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  project_id TEXT UNIQUE,
  title TEXT,
  subtitle TEXT,
  type_label TEXT,
  cat_label TEXT,
  year TEXT,
  location TEXT,
  body TEXT,
  body_detail TEXT,
  hero_placeholder TEXT,
  hero_image_url TEXT,
  gallery_1_url TEXT,
  gallery_2_url TEXT,
  gallery_3_url TEXT,
  gallery_4_url TEXT,
  gallery_5_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- All data is public readable (RLS enabled)
```

---

## 🚀 Deployment

### Local Development
```bash
cd /Users/punnathatpreyapanich/web
python3 -m http.server 8000
# Open http://localhost:8000
```

### Deploy to Netlify
See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full checklist.

Quick version:
1. Push to GitHub
2. Connect repo to Netlify
3. Set environment variables
4. Deploy → Done! 🎉

---

## 🔒 Security Notes

- ✅ API key is **public** (intentional - read-only)
- ✅ Projects table has RLS enabled (public read only)
- ✅ No sensitive data exposed
- ✅ No authentication required for viewing
- ⚠️ Admin panel uses localStorage (basic protection)

For production, consider:
- Add authentication to admin panel
- Use Supabase JWT tokens
- Implement rate limiting
- Add image upload to Supabase Storage

---

## 📈 Free Tier Limits

| Service | Free Limit | Current Usage |
|---------|-----------|----------------|
| Supabase Database | 500 MB | ~5 MB |
| Supabase Bandwidth | 2 GB/month | ~50 MB |
| Netlify Builds | 300/month | ~5 |
| Netlify Bandwidth | 100 GB/month | ~1 GB |

All well within free tier limits! ✅

---

## 🆘 Troubleshooting

### Admin panel shows "Cannot connect to Supabase"
1. Check `CONFIG.SUPABASE_URL` spelling (no typos!)
2. Check `CONFIG.SUPABASE_KEY` is complete
3. Verify Supabase project is active (not paused)

### Homepage shows sample data, not Supabase data
1. Confirm `SUPABASE_CONFIG` is set in `supabase-client.js`
2. Check browser console for errors
3. Verify projects table has data
4. Check RLS policies are enabled

### Deploy fails on Netlify
1. Check build logs in Netlify dashboard
2. Verify all files are committed to GitHub
3. Check environment variables are set
4. Try redeploying manually

### Project IDs have special characters, filtering breaks
- Use only lowercase letters, numbers, and hyphens
- Example: ✅ `sukhumvit-residence` ❌ `Sukhumvit Residence`

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **GitHub Help:** https://help.github.com
- **Web Standards:** https://developer.mozilla.org

---

## 📝 License

This project is open source and available under MIT License.

---

## 🎉 Next Steps

1. ✅ Follow **[QUICK_START.md](QUICK_START.md)** (15 minutes)
2. ✅ Add your projects in admin panel
3. ✅ Deploy to Netlify
4. ✅ Share with the world! 🚀

---

**Created with ❤️ for The Manual Studio**

**Version:** 1.0  
**Last Updated:** 2026-06-30  
**Status:** Production Ready ✅
