-- ============================================================
-- Add parent_id to regions for infinite nesting support
-- Execute this in Supabase SQL Editor
-- ============================================================

ALTER TABLE regions
  ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES regions(id) ON DELETE SET NULL;
