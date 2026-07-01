#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// อ่านค่า environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pzrjboiioplhijzyfdmf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cmpib2lpb3BsaGlqenlmZG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjMzMjAsImV4cCI6MjA5ODM5OTMyMH0.jxxENlcyfRrigb3nrEkxjclJqPYEa-WnPyJd_IuRxyw';

// อ่านไฟล์ index.html
const indexPath = path.join(__dirname, '../index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// แทนค่า environment variables
content = content.replace('{{ VITE_SUPABASE_URL }}', supabaseUrl);
content = content.replace('{{ VITE_SUPABASE_KEY }}', supabaseKey);

// บันทึกไฟล์
fs.writeFileSync(indexPath, content, 'utf8');

console.log('✅ Environment variables injected successfully');
