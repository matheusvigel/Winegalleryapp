-- ── wine_grapes: many-to-many between wines and grapes ────────────────────────
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hdnbnkcoyeehjhrqcuyi/sql

CREATE TABLE IF NOT EXISTS wine_grapes (
  wine_id   text NOT NULL REFERENCES wines(id)   ON DELETE CASCADE,
  grape_id  text NOT NULL REFERENCES grapes(id)  ON DELETE CASCADE,
  PRIMARY KEY (wine_id, grape_id)
);

CREATE INDEX IF NOT EXISTS idx_wine_grapes_wine_id  ON wine_grapes(wine_id);
CREATE INDEX IF NOT EXISTS idx_wine_grapes_grape_id ON wine_grapes(grape_id);

ALTER TABLE wine_grapes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wine_grapes' AND policyname = 'Public read wine_grapes'
  ) THEN
    CREATE POLICY "Public read wine_grapes"
      ON wine_grapes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wine_grapes' AND policyname = 'Auth write wine_grapes'
  ) THEN
    CREATE POLICY "Auth write wine_grapes"
      ON wine_grapes FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
