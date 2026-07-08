-- Removes the Fastwork manual-logging support added in 001. Fastwork has no
-- public API and the manual workflow was dropped as unnecessary — run this
-- once in the Supabase SQL editor to match the live table to 001's current
-- (Fastwork-free) definition. Safe to run even though no fastwork rows exist yet.

alter table conversations drop column if exists is_manual;

alter table conversations drop constraint if exists conversations_platform_check;
alter table conversations add constraint conversations_platform_check
  check (platform in ('facebook', 'instagram', 'line'));
