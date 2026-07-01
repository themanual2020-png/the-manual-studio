// Supabase Client Helper
// ใช้ Fetch API แทน @supabase/supabase-js library

class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Authorization': `Bearer ${this.key}`,
      'apikey': this.key,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.url}/rest/v1${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Supabase request error:', error);
      throw error;
    }
  }

  // Get all projects
  async getProjects() {
    return this.request('/projects?order=created_at.desc');
  }

  // Get single project by project_id
  async getProject(projectId) {
    const data = await this.request(`/projects?project_id=eq.${projectId}`);
    return data[0] || null;
  }

  // Insert project
  async insertProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Prefer': 'return=representation' },
    });
  }

  // Update project
  async updateProject(id, data) {
    return this.request(`/projects?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete project
  async deleteProject(id) {
    return this.request(`/projects?id=eq.${id}`, {
      method: 'DELETE',
    });
  }

  // Search projects by category
  async getProjectsByCategory(category) {
    return this.request(`/projects?cat_label=eq.${encodeURIComponent(category)}&order=created_at.desc`);
  }
}

// Create global instance (update these from Supabase Settings)
const SUPABASE_CONFIG = {
  URL: window.SUPABASE_URL || 'https://pzrjboiioplhijzyfdmf.supabase.co',
  KEY: window.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmpib2lpb3BsaGlqenlmZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjMzMjAsImV4cCI6MjA5ODM5OTMyMH0.jxxENlcyfRrigb3nrEkxjclJqPYEa-WnPyJd_IuRxyw'
};

// Initialize client
let supabase = null;

function initSupabase() {
  if (SUPABASE_CONFIG.URL === 'https://YOUR_PROJECT_ID.supabase.co') {
    console.warn('⚠️ Supabase not configured. Using fallback data.');
    return false;
  }
  supabase = new SupabaseClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
  return true;
}

// Fallback data (ใช้เมื่อ Supabase ไม่ตั้งค่า)
const FALLBACK_PROJECTS = [
  {
    id: '1',
    project_id: 'sukhumvit-residence',
    title: 'Sukhumvit Residence',
    subtitle: 'บ้านพักอาศัย · Interior & Exterior',
    typeLabel: 'Photography',
    catLabel: 'INTERIOR & EXTERIOR',
    year: '2025',
    location: 'กรุงเทพมหานคร',
    body: 'บ้านพักอาศัยส่วนตัวบนถนนสุขุมวิท ที่ผสมผสานความเป็นส่วนตัวและความทันสมัยไว้ด้วยกัน',
    bodyDetail: 'งานภาพถ่ายสถาปัตยกรรมที่บันทึกทั้งพื้นที่ภายในและภายนอก ให้ครบถ้วนทุกมุมมอง ด้วยแสงธรรมชาติและการจัดฉากที่ละเอียดอ่อน',
    heroPlaceholder: 'Sukhumvit Residence — hero',
  },
  {
    id: '2',
    project_id: 'riverside-hotel',
    title: 'Riverside Hotel',
    subtitle: 'โรงแรม · Interior & Exterior',
    typeLabel: 'Photography + Videography',
    catLabel: 'INTERIOR & EXTERIOR',
    year: '2025',
    location: 'กรุงเทพมหานคร',
    body: 'โรงแรมริมแม่น้ำเจ้าพระยา บรรยากาศคลาสสิกผสมร่วมสมัย',
    bodyDetail: 'งานถ่ายภาพและวิดีโอครอบคลุมพื้นที่ทุกส่วนของโรงแรม ตั้งแต่ล็อบบี้ ห้องพัก ไปจนถึงมุมมองริมแม่น้ำ',
    heroPlaceholder: 'Riverside Hotel — hero',
  },
  // ... other projects
];

// Get projects with fallback
async function getProjects() {
  if (!supabase) {
    return FALLBACK_PROJECTS;
  }
  try {
    const data = await supabase.getProjects();
    return data;
  } catch (error) {
    console.warn('Failed to fetch from Supabase, using fallback:', error);
    return FALLBACK_PROJECTS;
  }
}

// Get single project
async function getProject(projectId) {
  if (!supabase) {
    return FALLBACK_PROJECTS.find(p => p.project_id === projectId);
  }
  try {
    const data = await supabase.getProject(projectId);
    return data;
  } catch (error) {
    console.warn('Failed to fetch project, using fallback:', error);
    return FALLBACK_PROJECTS.find(p => p.project_id === projectId);
  }
}

// Normalize field names (Supabase snake_case → camelCase)
function normalizeProject(p) {
  return {
    id: p.id,
    project_id: p.project_id,
    title: p.title,
    subtitle: p.subtitle,
    typeLabel: p.type_label || p.typeLabel,
    catLabel: p.cat_label || p.catLabel,
    year: p.year,
    location: p.location,
    body: p.body,
    bodyDetail: p.body_detail || p.bodyDetail,
    heroPlaceholder: p.hero_placeholder || p.heroPlaceholder,
  };
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupabase);
} else {
  initSupabase();
}
