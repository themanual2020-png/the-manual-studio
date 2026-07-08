const fs = require('fs');
const path = require('path');

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmpib2lpb3BsaGlqenlmZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjMzMjAsImV4cCI6MjA5ODM5OTMyMH0.jxxENlcyfRrigb3nrEkxjclJqPYEa-WnPyJd_IuRxyw';
const BASE_URL = 'https://themanualstudio.vercel.app';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripMarkdown(s) {
  return String(s)
    .replace(/^##\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
}

module.exports = async function handler(req, res) {
  const pid = req.query.id;
  let html = fs.readFileSync(path.join(process.cwd(), '_project-template.html'), 'utf8');

  if (pid) {
    try {
      const r = await fetch(
        `${SUPA_URL}/rest/v1/projects?project_id=eq.${encodeURIComponent(pid)}&select=title,subtitle,body,hero_placeholder`,
        { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
      );
      const data = await r.json();
      const p = Array.isArray(data) ? data[0] : null;

      if (p) {
        const title = escapeXml(`${p.title} — The Manual Studio`);
        const desc = escapeXml(stripMarkdown(p.body || p.subtitle || '').slice(0, 160));
        const img = escapeXml(p.hero_placeholder || `${BASE_URL}/assets/og-image.jpg`);
        const url = escapeXml(`${BASE_URL}/project.html?id=${encodeURIComponent(pid)}`);

        html = html
          .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
          .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${desc}">`)
          .replace(/<link rel="canonical" href=".*?">/, `<link rel="canonical" href="${url}">`)
          .replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${url}">`)
          .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`)
          .replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${desc}">`)
          .replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${img}">`)
          .replace(/<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${title}">`)
          .replace(/<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${desc}">`)
          .replace(/<meta name="twitter:image" content=".*?">/, `<meta name="twitter:image" content="${img}">`);
      }
    } catch (e) {
      // fall through and serve the generic static html
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(html);
};
