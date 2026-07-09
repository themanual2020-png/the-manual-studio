-- Supports multiple Facebook Pages (each with its own Page Access Token,
-- and optionally a linked Instagram Business Account) feeding into the same
-- inbox. Run once in the Supabase SQL editor for this project.

alter table conversations add column if not exists platform_page_id text;

create table if not exists meta_pages (
  id uuid primary key default gen_random_uuid(),
  page_id text not null unique,
  ig_account_id text unique,
  page_name text,
  access_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table meta_pages enable row level security;
