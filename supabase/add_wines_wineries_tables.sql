-- ============================================================
-- Migration: Create wines + wineries tables (if not yet applied)
-- and ensure RLS write policies exist for authenticated admins.
-- Run in Supabase SQL Editor — all statements are idempotent.
-- ============================================================

-- ── wineries ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wineries (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          text NOT NULL,
  photo         text NOT NULL DEFAULT '',
  region_id     text REFERENCES regions(id) ON DELETE SET NULL,
  sub_region_id text REFERENCES regions(id) ON DELETE SET NULL,
  category      text CHECK (category IN ('Essencial', 'Fugir do óbvio', 'Ícones')),
  highlight     text,
  buy_link      text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wineries_region_id ON wineries(region_id);

ALTER TABLE wineries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wineries' AND policyname = 'Public read wineries'
  ) THEN
    CREATE POLICY "Public read wineries" ON wineries FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wineries' AND policyname = 'Auth write wineries'
  ) THEN
    CREATE POLICY "Auth write wineries" ON wineries FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── wines ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wines (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          text NOT NULL,
  photo         text NOT NULL DEFAULT '',
  winery_id     text REFERENCES wineries(id) ON DELETE SET NULL,
  category      text NOT NULL DEFAULT 'Essencial'
                  CHECK (category IN ('Essencial', 'Fugir do óbvio', 'Ícones')),
  type          text NOT NULL DEFAULT 'Tinto'
                  CHECK (type IN ('Tinto', 'Branco', 'Rosé', 'Espumante', 'Fortificado', 'Laranja', 'Sobremesa')),
  method        text,
  highlight     text NOT NULL DEFAULT '',
  pairing       text,
  tasting_note  text,
  average_price decimal(10,2),
  buy_link      text,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wines_winery_id ON wines(winery_id);

ALTER TABLE wines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wines' AND policyname = 'Public read wines'
  ) THEN
    CREATE POLICY "Public read wines" ON wines FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wines' AND policyname = 'Auth write wines'
  ) THEN
    CREATE POLICY "Auth write wines" ON wines FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── regions: ensure write policy exists ──────────────────────
-- (original schema.sql only adds SELECT; policies.sql adds write)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'regions' AND policyname = 'regions_write'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'regions' AND policyname = 'Auth write regions'
  ) THEN
    CREATE POLICY "Auth write regions"
      ON regions FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── collections: ensure write policy exists ───────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'collections_write'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Auth write collections'
  ) THEN
    CREATE POLICY "Auth write collections"
      ON collections FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── collection_items: ensure write policy exists ──────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collection_items' AND policyname = 'collection_items_write'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'collection_items' AND policyname = 'Auth write collection_items'
  ) THEN
    CREATE POLICY "Auth write collection_items"
      ON collection_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
