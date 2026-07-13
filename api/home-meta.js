const fs = require('fs');
const path = require('path');

const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmpib2lpb3BsaGlqenlmZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjMzMjAsImV4cCI6MjA5ODM5OTMyMH0.jxxENlcyfRrigb3nrEkxjclJqPYEa-WnPyJd_IuRxyw';
const BASE_URL = 'https://themanualth.co';

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
  let html = fs.readFileSync(path.join(process.cwd(), '_home-template.html'), 'utf8');

  try {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/site_settings?page=eq.home&select=title,description,keywords`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
    );
    const data = await r.json();
    const s = Array.isArray(data) ? data[0] : null;

    if (s) {
      const title = escapeXml(s.title || '');
      const desc = escapeXml(s.description || '');
      const keywords = escapeXml(s.keywords || '');

      html = html
        .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${desc}">`)
        .replace(/<meta name="keywords" content=".*?">/, `<meta name="keywords" content="${keywords}">`)
        .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`)
        .replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${desc}">`)
        .replace(/<meta name="twitter:title" content=".*?">/, `<meta name="twitter:title" content="${title}">`)
        .replace(/<meta name="twitter:description" content=".*?">/, `<meta name="twitter:description" content="${desc}">`)
        .replace(/"description": ".*?",\n {2}"url": "https:\/\/themanualth\.co"/, `"description": "${desc.replace(/"/g, '\\"')}",\n  "url": "https://themanualth.co"`);
    }
  } catch (e) {
    // fall through and serve the generic static html with its hardcoded fallback meta tags
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(html);
};
