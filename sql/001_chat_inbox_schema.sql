-- Chat inbox schema: conversations, messages, kb_entries
-- Run this once in the Supabase SQL editor for this project.
--
-- RLS is enabled on all three tables with NO policies for anon/authenticated —
-- this is a deliberate default-deny, unlike the public-read `projects` table.
-- All access goes through server-side api/ endpoints using the
-- SUPABASE_SERVICE_ROLE_KEY (server env var only), which bypasses RLS.

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook', 'instagram', 'line', 'fastwork')),
  platform_thread_id text,
  customer_name text,
  customer_avatar_url text,
  status text not null default 'open' check (status in ('open', 'pending_review', 'waiting_customer', 'closed')),
  is_manual boolean not null default false,
  last_message_at timestamptz,
  last_message_preview text,
  unread_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists conversations_platform_thread_unique
  on conversations (platform, platform_thread_id)
  where platform_thread_id is not null;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_type text not null check (sender_type in ('customer', 'admin', 'ai_auto', 'ai_draft')),
  platform_message_id text,
  content_type text not null default 'text',
  content text,
  attachments jsonb,
  ai_suggested_reply text,
  ai_category text check (ai_category in ('faq', 'pricing', 'booking_availability', 'negotiation', 'other')),
  requires_approval boolean not null default false,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz not null default now()
);

create unique index if not exists messages_platform_message_unique
  on messages (platform_message_id)
  where platform_message_id is not null;

create index if not exists messages_conversation_id_idx on messages (conversation_id, created_at);

create table if not exists kb_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'faq', 'pricing', 'service_interior_exterior', 'service_architect',
    'service_real_estate', 'service_designer', 'policy', 'general'
  )),
  topic text,
  content text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table conversations enable row level security;
alter table messages enable row level security;
alter table kb_entries enable row level security;
