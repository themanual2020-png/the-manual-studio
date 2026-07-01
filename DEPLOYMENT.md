# 🚀 Deployment Checklist

## Pre-Deployment

- [ ] Supabase credentials set in `supabase-client.js`
- [ ] Supabase credentials set in `admin.html`
- [ ] At least 3 sample projects added in Supabase
- [ ] Admin panel tested and working (`http://localhost:8000/admin.html`)
- [ ] Homepage loads projects from Supabase
- [ ] Project detail page works with URL parameters
- [ ] All images/assets are accessible

---

## GitHub Setup

- [ ] GitHub account created
- [ ] Created new repo: `the-manual-studio`
- [ ] Git initialized locally: `git init`
- [ ] First commit: `git commit -m "Initial commit"`
- [ ] Remote added: `git remote add origin https://github.com/USERNAME/the-manual-studio.git`
- [ ] Pushed to main: `git push -u origin main`

---

## Netlify Deployment

### Account Setup
- [ ] Netlify account created (https://netlify.com)
- [ ] Logged in with GitHub

### Site Setup
- [ ] Clicked "Add new site" → "Import existing project"
- [ ] Selected GitHub as provider
- [ ] Authorized Netlify to access GitHub
- [ ] Selected `the-manual-studio` repository
- [ ] Build settings configured (auto-detected)
- [ ] Site deployed (wait 1-2 minutes)

### Environment Variables
- [ ] Set `VITE_SUPABASE_URL` in Netlify
- [ ] Set `VITE_SUPABASE_KEY` in Netlify
- [ ] Triggered redeploy after setting env vars

---

## Post-Deployment Testing

- [ ] Homepage loads correctly: `https://YOUR_SITE.netlify.app`
- [ ] Navigation works (click WORK, ABOUT, CONTACT)
- [ ] Filter buttons work (ALL, INTERIOR, EVENT, etc.)
- [ ] Project detail pages load: `?id=sukhumvit-residence`
- [ ] Next project navigation works
- [ ] Admin panel accessible: `https://YOUR_SITE.netlify.app/admin.html`
- [ ] Can add new projects via admin panel
- [ ] Newly added projects appear on homepage
- [ ] Mobile responsive (test on phone)

---

## Optional: Custom Domain

- [ ] Purchased domain (Namecheap, GoDaddy, etc.)
- [ ] Added domain in Netlify: **Site settings → Domain management**
- [ ] Updated DNS records to Netlify nameservers
- [ ] SSL certificate auto-generated (Let's Encrypt)
- [ ] Site accessible at `https://yourdomain.com`

---

## SEO & Performance

- [ ] Titles and meta descriptions set
- [ ] Images optimized (under 500KB each)
- [ ] Lighthouse score checked (> 90)
- [ ] Mobile performance tested

---

## Monitoring

- [ ] Netlify deploy notifications enabled
- [ ] Supabase status page bookmarked
- [ ] Regular backups of Supabase data
- [ ] Analytics enabled (Netlify built-in)

---

## Documentation

- [ ] README created with setup instructions
- [ ] API documentation updated
- [ ] Admin guide written for team members
- [ ] Troubleshooting guide added

---

## Budget Check

### Free Tier Limits (should not exceed)
| Service | Limit | Current | Status |
|---------|-------|---------|--------|
| Supabase Storage | 1 GB | 0 MB | ✅ |
| Supabase Bandwidth | 2 GB/month | 0 MB | ✅ |
| Netlify Builds | 300/month | ~5 | ✅ |
| GitHub Repos | ∞ | 1 | ✅ |

---

## Launch Checklist

- [ ] All tests passed
- [ ] Client reviewed and approved
- [ ] Domain configured (or using netlify.app)
- [ ] Backup plan documented
- [ ] Support contact info provided
- [ ] Go live! 🎉

---

## Post-Launch

- [ ] Monitor error logs (Netlify, Supabase)
- [ ] User feedback collected
- [ ] Analytics reviewed
- [ ] Update schedule created for content

---

**Deployed by:** _______________  
**Date:** _______________  
**Production URL:** _______________  
**Admin Panel:** _______________  
**Notes:** _______________

---

If you need help at any point, check:
1. Netlify Documentation: https://docs.netlify.com
2. Supabase Documentation: https://supabase.com/docs
3. GitHub Help: https://help.github.com
