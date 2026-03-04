-- ============================================================
-- Wine Gallery App - RLS Policies + Storage
-- Execute this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================

alter table countries           enable row level security;
alter table regions             enable row level security;
alter table collections         enable row level security;
alter table region_collections  enable row level security;
alter table brands              enable row level security;
alter table brand_collections   enable row level security;
alter table grapes              enable row level security;
alter table grape_collections   enable row level security;
alter table wine_items          enable row level security;
alter table collection_items    enable row level security;
alter table wine_item_regions   enable row level security;
alter table wine_item_grapes    enable row level security;
alter table user_progress       enable row level security;
alter table user_stats          enable row level security;

-- ============================================================
-- 2. CONTENT TABLES (public read, authenticated write)
--    countries, regions, collections, brands, grapes, wine_items
--    and all junction tables
-- ============================================================

-- countries
create policy "countries_read"  on countries for select using (true);
create policy "countries_write" on countries for all to authenticated using (true) with check (true);

-- regions
create policy "regions_read"  on regions for select using (true);
create policy "regions_write" on regions for all to authenticated using (true) with check (true);

-- collections
create policy "collections_read"  on collections for select using (true);
create policy "collections_write" on collections for all to authenticated using (true) with check (true);

-- region_collections
create policy "region_collections_read"  on region_collections for select using (true);
create policy "region_collections_write" on region_collections for all to authenticated using (true) with check (true);

-- brands
create policy "brands_read"  on brands for select using (true);
create policy "brands_write" on brands for all to authenticated using (true) with check (true);

-- brand_collections
create policy "brand_collections_read"  on brand_collections for select using (true);
create policy "brand_collections_write" on brand_collections for all to authenticated using (true) with check (true);

-- grapes
create policy "grapes_read"  on grapes for select using (true);
create policy "grapes_write" on grapes for all to authenticated using (true) with check (true);

-- grape_collections
create policy "grape_collections_read"  on grape_collections for select using (true);
create policy "grape_collections_write" on grape_collections for all to authenticated using (true) with check (true);

-- wine_items
create policy "wine_items_read"  on wine_items for select using (true);
create policy "wine_items_write" on wine_items for all to authenticated using (true) with check (true);

-- collection_items
create policy "collection_items_read"  on collection_items for select using (true);
create policy "collection_items_write" on collection_items for all to authenticated using (true) with check (true);

-- wine_item_regions
create policy "wine_item_regions_read"  on wine_item_regions for select using (true);
create policy "wine_item_regions_write" on wine_item_regions for all to authenticated using (true) with check (true);

-- wine_item_grapes
create policy "wine_item_grapes_read"  on wine_item_grapes for select using (true);
create policy "wine_item_grapes_write" on wine_item_grapes for all to authenticated using (true) with check (true);

-- ============================================================
-- 3. USER DATA TABLES (only the owner can read/write)
-- ============================================================

-- user_progress
create policy "user_progress_read"  on user_progress for select using (auth.uid() = user_id);
create policy "user_progress_write" on user_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_stats
create policy "user_stats_read"  on user_stats for select using (auth.uid() = user_id);
create policy "user_stats_write" on user_stats for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 4. STORAGE — wine-images bucket
--    Run AFTER creating the bucket manually in the dashboard
--    (Storage → New bucket → name: wine-images → Public)
-- ============================================================

-- Anyone can read images (public bucket)
create policy "images_read"
  on storage.objects for select
  using (bucket_id = 'wine-images');

-- Authenticated users can upload images
create policy "images_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'wine-images');

-- Authenticated users can update/delete their own uploads
create policy "images_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'wine-images');

create policy "images_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'wine-images');
