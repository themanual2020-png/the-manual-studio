// Supabase Configuration
// ใส่ค่าของคุณหลังจากสร้าง Supabase project

const SUPABASE_CONFIG = {
  URL: 'https://pzrjboiioplhijzyfdmf.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmpib2lpb3BsaGlqenlmZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjMzMjAsImV4cCI6MjA5ODM5OTMyMH0.jxxENlcyfRrigb3nrEkxjclJqPYEa-WnPyJd_IuRxyw'
};

// After getting values from Supabase:
// 1. Go to Settings → API
// 2. Copy Project URL → paste ใน URL
// 3. Copy "anon" key → paste ใน ANON_KEY

// Initialize Supabase client (requires @supabase/supabase-js)
// สำหรับตอนนี้จะใช้ fetch() API แทน
