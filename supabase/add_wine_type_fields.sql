-- ============================================================
-- Migration: Add wine_type and elaboration_method to wine_items
-- Execute in Supabase SQL Editor
-- ============================================================

ALTER TABLE wine_items ADD COLUMN IF NOT EXISTS wine_type text;
ALTER TABLE wine_items ADD COLUMN IF NOT EXISTS elaboration_method text;
