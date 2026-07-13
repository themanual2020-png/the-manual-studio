#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// อ่านค่า environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pzrjboiioplhijzyfdmf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmpib2lpb3BsaGlqenlmZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjMzMjAsImV4cCI6MjA5ODM5OTMyMH0.jxxENlcyfRrigb3nrEkxjclJqPYEa-WnPyJd_IuRxyw';

// inject ทุกไฟล์ HTML
const htmlFiles = ['_home-template.html', '_project-template.html', 'admin.html', '_about-template.html', 'login.html'];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\{\{ VITE_SUPABASE_URL \}\}/g, supabaseUrl);
  content = content.replace(/\{\{ VITE_SUPABASE_KEY \}\}/g, supabaseKey);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Injected: ${file}`);
});
