-- ============================================================
-- Migration: Add brotherhoods catalog + reviews + user_profiles
-- Execute in Supabase SQL Editor
-- ============================================================

-- ── brotherhoods (catalog — official wine societies) ─────────
CREATE TABLE IF NOT EXISTS brotherhoods (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        text NOT NULL,
  photo       text NOT NULL DEFAULT '',
  region_id   text REFERENCES regions(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  highlight   text NOT NULL DEFAULT '',
  website     text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brotherhoods_region_id ON brotherhoods(region_id);

ALTER TABLE brotherhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brotherhoods"
  ON brotherhoods FOR SELECT USING (true);
CREATE POLICY "Auth write brotherhoods"
  ON brotherhoods FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id       text NOT NULL,
  item_type     text NOT NULL CHECK (item_type IN ('wine', 'winery', 'experience', 'region', 'grape', 'brotherhood')),
  rating        integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       text,
  photos        text[],
  points_earned integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id   ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_item_id   ON reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_item_type ON reviews(item_type);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reviews"           ON reviews FOR SELECT USING (true);
CREATE POLICY "Users insert own reviews"      ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews"      ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews"      ON reviews FOR DELETE USING (auth.uid() = user_id);

-- ── user_profiles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name       text NOT NULL DEFAULT '',
  bio                text,
  avatar             text,
  location           text,
  favorite_wine_type text,
  total_points       integer NOT NULL DEFAULT 0,
  level              integer NOT NULL DEFAULT 1,
  followers_count    integer NOT NULL DEFAULT 0,
  following_count    integer NOT NULL DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read user_profiles"          ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile"           ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile"           ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- ── updated_at trigger (reuse existing function) ─────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brotherhoods_updated_at
  BEFORE UPDATE ON brotherhoods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
