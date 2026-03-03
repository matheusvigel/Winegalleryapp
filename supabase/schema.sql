-- ============================================================
-- Wine Gallery App - Database Schema
-- Execute this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type wine_level as enum ('essential', 'escape', 'icon');
create type item_type as enum ('wine', 'winery');
create type grape_type as enum ('red', 'white');
create type progress_status as enum ('wishlist', 'completed');

-- ============================================================
-- REFERENCE DATA TABLES
-- ============================================================

create table countries (
  id          text primary key,
  name        text not null,
  image_url   text not null,
  description text not null,
  created_at  timestamptz default now()
);

create table regions (
  id          text primary key,
  name        text not null,
  country_id  text not null references countries(id) on delete cascade,
  image_url   text not null,
  description text not null,
  created_at  timestamptz default now()
);

create table collections (
  id           text primary key,
  title        text not null,
  description  text not null,
  level        wine_level not null,
  cover_image  text not null,
  total_points integer not null default 0,
  created_at   timestamptz default now()
);

-- Many-to-many: regions <-> collections
create table region_collections (
  region_id     text not null references regions(id) on delete cascade,
  collection_id text not null references collections(id) on delete cascade,
  primary key (region_id, collection_id)
);

create table brands (
  id          text primary key,
  name        text not null,
  description text not null,
  image_url   text not null,
  country     text not null,
  region      text,
  created_at  timestamptz default now()
);

-- Many-to-many: brands <-> collections
create table brand_collections (
  brand_id      text not null references brands(id) on delete cascade,
  collection_id text not null references collections(id) on delete cascade,
  primary key (brand_id, collection_id)
);

create table grapes (
  id              text primary key,
  name            text not null,
  description     text not null,
  image_url       text not null,
  type            grape_type not null,
  characteristics text not null,
  created_at      timestamptz default now()
);

-- Many-to-many: grapes <-> collections
create table grape_collections (
  grape_id      text not null references grapes(id) on delete cascade,
  collection_id text not null references collections(id) on delete cascade,
  primary key (grape_id, collection_id)
);

create table wine_items (
  id          text primary key,
  name        text not null,
  description text not null,
  type        item_type not null,
  image_url   text not null,
  points      integer not null default 10,
  level       wine_level not null,
  brand_id    text references brands(id) on delete set null,
  created_at  timestamptz default now()
);

-- Many-to-many: collections <-> wine_items
create table collection_items (
  collection_id text not null references collections(id) on delete cascade,
  item_id       text not null references wine_items(id) on delete cascade,
  primary key (collection_id, item_id)
);

-- Many-to-many: wine_items <-> regions
create table wine_item_regions (
  wine_item_id text not null references wine_items(id) on delete cascade,
  region_id    text not null references regions(id) on delete cascade,
  primary key (wine_item_id, region_id)
);

-- Many-to-many: wine_items <-> grapes
create table wine_item_grapes (
  wine_item_id text not null references wine_items(id) on delete cascade,
  grape_id     text not null references grapes(id) on delete cascade,
  primary key (wine_item_id, grape_id)
);

-- ============================================================
-- USER DATA TABLES
-- ============================================================

create table user_progress (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  item_id    text not null references wine_items(id) on delete cascade,
  status     progress_status not null,
  timestamp  bigint not null default extract(epoch from now()) * 1000,
  created_at timestamptz default now(),
  unique (user_id, item_id)
);

create table user_stats (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  total_points    integer not null default 0,
  completed_count integer not null default 0,
  wishlist_count  integer not null default 0,
  level           integer not null default 1,
  updated_at      timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_regions_country_id on regions(country_id);
create index idx_wine_items_brand_id on wine_items(brand_id);
create index idx_wine_items_level on wine_items(level);
create index idx_user_progress_user_id on user_progress(user_id);
create index idx_user_progress_item_id on user_progress(item_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Reference data: public read, no write
alter table countries enable row level security;
alter table regions enable row level security;
alter table collections enable row level security;
alter table region_collections enable row level security;
alter table brands enable row level security;
alter table brand_collections enable row level security;
alter table grapes enable row level security;
alter table grape_collections enable row level security;
alter table wine_items enable row level security;
alter table collection_items enable row level security;
alter table wine_item_regions enable row level security;
alter table wine_item_grapes enable row level security;

-- User data: users see only their own rows
alter table user_progress enable row level security;
alter table user_stats enable row level security;

-- Public read policies for reference data
create policy "Public read countries"         on countries         for select using (true);
create policy "Public read regions"           on regions           for select using (true);
create policy "Public read collections"       on collections       for select using (true);
create policy "Public read region_collections" on region_collections for select using (true);
create policy "Public read brands"            on brands            for select using (true);
create policy "Public read brand_collections" on brand_collections for select using (true);
create policy "Public read grapes"            on grapes            for select using (true);
create policy "Public read grape_collections" on grape_collections for select using (true);
create policy "Public read wine_items"        on wine_items        for select using (true);
create policy "Public read collection_items"  on collection_items  for select using (true);
create policy "Public read wine_item_regions" on wine_item_regions for select using (true);
create policy "Public read wine_item_grapes"  on wine_item_grapes  for select using (true);

-- User progress: own data only
create policy "Users read own progress"
  on user_progress for select
  using (auth.uid() = user_id);

create policy "Users insert own progress"
  on user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users update own progress"
  on user_progress for update
  using (auth.uid() = user_id);

create policy "Users delete own progress"
  on user_progress for delete
  using (auth.uid() = user_id);

-- User stats: own data only
create policy "Users read own stats"
  on user_stats for select
  using (auth.uid() = user_id);

create policy "Users insert own stats"
  on user_stats for insert
  with check (auth.uid() = user_id);

create policy "Users update own stats"
  on user_stats for update
  using (auth.uid() = user_id);
