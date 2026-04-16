-- ============================================================
-- Migration: Add fields from Figma Make schema to existing tables
-- Execute in Supabase SQL Editor
-- ============================================================

-- ── brands (= wineries) ──────────────────────────────────────
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS category  text CHECK (category IN ('Essencial', 'Fugir do óbvio', 'Ícones')),
  ADD COLUMN IF NOT EXISTS highlight text,
  ADD COLUMN IF NOT EXISTS buy_link  text;

-- ── wine_items ───────────────────────────────────────────────
ALTER TABLE wine_items
  ADD COLUMN IF NOT EXISTS highlight          text,
  ADD COLUMN IF NOT EXISTS tasting_note       text,
  ADD COLUMN IF NOT EXISTS average_price      decimal(10,2),
  ADD COLUMN IF NOT EXISTS buy_link           text,
  ADD COLUMN IF NOT EXISTS year               integer;

-- elaboration_method already exists as elaborationMethod (snake_case column)
-- Add if not present
ALTER TABLE wine_items
  ADD COLUMN IF NOT EXISTS elaboration_method text;

-- ── experiences ──────────────────────────────────────────────
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS highlight text,
  ADD COLUMN IF NOT EXISTS buy_link  text;

-- ── collections ──────────────────────────────────────────────
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS tagline text;

-- ── grapes: extend type enum ─────────────────────────────────
-- Note: each ALTER TYPE ADD VALUE must run outside a transaction block
-- Run each line individually if inside a transaction

ALTER TYPE grape_type ADD VALUE IF NOT EXISTS 'rosé';
ALTER TYPE grape_type ADD VALUE IF NOT EXISTS 'espumante';
ALTER TYPE grape_type ADD VALUE IF NOT EXISTS 'laranja';
ALTER TYPE grape_type ADD VALUE IF NOT EXISTS 'sobremesa';
ALTER TYPE grape_type ADD VALUE IF NOT EXISTS 'fortificado';
