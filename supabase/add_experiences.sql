-- ============================================================
-- Add experiences entity + junction tables
-- Execute in Supabase SQL Editor
-- ============================================================

create type experience_category as enum ('visita', 'degustacao', 'tour', 'curso', 'evento', 'harmonizacao');

create table experiences (
  id                  text primary key default gen_random_uuid()::text,
  name                text not null,
  description         text not null default '',
  category            experience_category not null default 'visita',
  image_url           text not null default '',
  points              integer not null default 10,
  level               wine_level not null default 'essential',
  brand_id            text references brands(id) on delete set null,
  duration_minutes    integer,
  price_range         text,
  created_at          timestamptz default now()
);

-- Many-to-many: experiences <-> regions
create table experience_regions (
  experience_id text not null references experiences(id) on delete cascade,
  region_id     text not null references regions(id) on delete cascade,
  primary key (experience_id, region_id)
);

-- Many-to-many: experiences <-> collections
create table collection_experiences (
  collection_id text not null references collections(id) on delete cascade,
  experience_id text not null references experiences(id) on delete cascade,
  primary key (collection_id, experience_id)
);

-- RLS
alter table experiences enable row level security;
create policy "Public read experiences" on experiences for select using (true);
create policy "Auth write experiences" on experiences for all to authenticated using (true) with check (true);

alter table experience_regions enable row level security;
create policy "Public read experience_regions" on experience_regions for select using (true);
create policy "Auth write experience_regions" on experience_regions for all to authenticated using (true) with check (true);

alter table collection_experiences enable row level security;
create policy "Public read collection_experiences" on collection_experiences for select using (true);
create policy "Auth write collection_experiences" on collection_experiences for all to authenticated using (true) with check (true);
