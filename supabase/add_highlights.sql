-- ============================================================
-- Add highlights table for home page featured content
-- Execute in Supabase SQL Editor
-- ============================================================

create type highlight_type as enum ('collection', 'country', 'region', 'brand');

create table highlights (
  id          text primary key default gen_random_uuid()::text,
  type        highlight_type not null,
  entity_id   text not null,
  label       text,
  position    integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz default now()
);

-- RLS
alter table highlights enable row level security;
create policy "Public read highlights" on highlights for select using (true);
create policy "Auth write highlights" on highlights for all to authenticated using (true) with check (true);
