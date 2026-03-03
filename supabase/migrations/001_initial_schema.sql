-- WineGallery App - Initial Schema
-- Run this in your Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

-- Countries
CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regions
CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country_id TEXT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  country TEXT,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grapes
CREATE TABLE IF NOT EXISTS grapes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('red', 'white')),
  characteristics TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections (can belong to a region, brand, OR grape)
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK (level IN ('essential', 'escape', 'icon')),
  cover_image TEXT,
  total_points INTEGER DEFAULT 0,
  region_id TEXT REFERENCES regions(id) ON DELETE SET NULL,
  brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
  grape_id TEXT REFERENCES grapes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wine Items (wines and wineries)
CREATE TABLE IF NOT EXISTS wine_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('wine', 'winery')),
  image_url TEXT,
  points INTEGER DEFAULT 10,
  level TEXT NOT NULL CHECK (level IN ('essential', 'escape', 'icon')),
  brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection Items (many-to-many)
CREATE TABLE IF NOT EXISTS collection_items (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES wine_items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (collection_id, item_id)
);

-- Item Regions (many-to-many)
CREATE TABLE IF NOT EXISTS item_regions (
  item_id TEXT NOT NULL REFERENCES wine_items(id) ON DELETE CASCADE,
  region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, region_id)
);

-- Item Grapes (many-to-many)
CREATE TABLE IF NOT EXISTS item_grapes (
  item_id TEXT NOT NULL REFERENCES wine_items(id) ON DELETE CASCADE,
  grape_id TEXT NOT NULL REFERENCES grapes(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, grape_id)
);

-- User Progress (anonymous users tracked by session key)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key TEXT NOT NULL,
  item_id TEXT NOT NULL REFERENCES wine_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('wishlist', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_key, item_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_regions_country_id ON regions(country_id);
CREATE INDEX IF NOT EXISTS idx_collections_region_id ON collections(region_id);
CREATE INDEX IF NOT EXISTS idx_collections_brand_id ON collections(brand_id);
CREATE INDEX IF NOT EXISTS idx_collections_grape_id ON collections(grape_id);
CREATE INDEX IF NOT EXISTS idx_wine_items_brand_id ON wine_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_item_regions_region_id ON item_regions(region_id);
CREATE INDEX IF NOT EXISTS idx_item_grapes_grape_id ON item_grapes(grape_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_key ON user_progress(user_key);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_regions_updated_at BEFORE UPDATE ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_grapes_updated_at BEFORE UPDATE ON grapes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_wine_items_updated_at BEFORE UPDATE ON wine_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE grapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_grapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Public read access for catalog data
CREATE POLICY "Public read countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Public read regions" ON regions FOR SELECT USING (true);
CREATE POLICY "Public read brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read grapes" ON grapes FOR SELECT USING (true);
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Public read wine_items" ON wine_items FOR SELECT USING (true);
CREATE POLICY "Public read collection_items" ON collection_items FOR SELECT USING (true);
CREATE POLICY "Public read item_regions" ON item_regions FOR SELECT USING (true);
CREATE POLICY "Public read item_grapes" ON item_grapes FOR SELECT USING (true);

-- Admin full access (use service_role key for backoffice operations)
CREATE POLICY "Admin full access countries" ON countries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access regions" ON regions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access grapes" ON grapes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access collections" ON collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access wine_items" ON wine_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access collection_items" ON collection_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access item_regions" ON item_regions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access item_grapes" ON item_grapes FOR ALL USING (true) WITH CHECK (true);

-- User progress: each user sees only their own data
CREATE POLICY "Users can read own progress" ON user_progress FOR SELECT USING (true);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (true);
CREATE POLICY "Users can delete own progress" ON user_progress FOR DELETE USING (true);
