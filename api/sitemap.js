const SUPA_URL = 'https://pzrjboiioplhijzyfdmf.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmpib2lpb3BsaGlqenlmZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjMzMjAsImV4cCI6MjA5ODM5OTMyMH0.jxxENlcyfRrigb3nrEkxjclJqPYEa-WnPyJd_IuRxyw';
const BASE_URL = 'https://themanualth.co';

module.exports = async function handler(req, res) {
  let projects = [];
  try {
    const r = await fetch(
      `${SUPA_URL}/rest/v1/projects?select=project_id,created_at&published=neq.false&order=created_at.desc`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
    );
    projects = await r.json();
    if (!Array.isArray(projects)) projects = [];
  } catch (e) {
    projects = [];
  }

  const staticUrls = [
    { loc: `${BASE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${BASE_URL}/about.html`, changefreq: 'monthly', priority: '0.8' },
  ];

  const projectUrls = projects.map((p) => ({
    loc: `${BASE_URL}/project.html?id=${encodeURIComponent(p.project_id)}`,
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: p.created_at ? String(p.created_at).slice(0, 10) : null,
  }));

  const all = [...staticUrls, ...projectUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
};
