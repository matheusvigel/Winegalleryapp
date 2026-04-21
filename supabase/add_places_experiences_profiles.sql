-- ═══════════════════════════════════════════════════════════════════
-- Migration: Places + Experience location_type + Profile Content Rules
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Add location_type to experiences ─────────────────────────────
--   Values: 'em_casa' | 'na_vinicola' | 'na_cidade'
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS location_type varchar(30) NOT NULL DEFAULT 'na_vinicola';


-- ── 2. Places table ─────────────────────────────────────────────────
--   Types: restaurant | accommodation | attraction
--   Sub-types are free-text strings managed in the backoffice
CREATE TABLE IF NOT EXISTS places (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  photo          TEXT,
  description    TEXT,
  highlight      TEXT,
  region_id      TEXT        REFERENCES regions(id) ON DELETE SET NULL,
  sub_region_id  TEXT        REFERENCES regions(id) ON DELETE SET NULL,
  type           TEXT        NOT NULL DEFAULT 'restaurant',
  sub_type       TEXT,
  website        TEXT,
  address        TEXT,
  price_range    TEXT,       -- '$' | '$$' | '$$$' | '$$$$'
  created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ── 3. Profile Content Rules ─────────────────────────────────────────
--   Defines the priority and visibility of each content category
--   per wine profile. priority 1 = shown first.
CREATE TABLE IF NOT EXISTS profile_content_rules (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile     TEXT        NOT NULL,   -- novato | curioso | desbravador | curador | expert
  category    TEXT        NOT NULL,   -- Essencial | Fugir do óbvio | Ícones
  priority    INT         NOT NULL DEFAULT 1,
  visible     BOOLEAN     NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT profile_content_rules_unique UNIQUE (profile, category)
);

-- Seed sensible defaults: novatos see Essencial first; experts see Ícones first
INSERT INTO profile_content_rules (profile, category, priority, visible) VALUES
  -- Novato: Essencial → Fugir do Óbvio → Ícones (hidden)
  ('novato',      'Essencial',      1, true),
  ('novato',      'Fugir do óbvio', 2, true),
  ('novato',      'Ícones',         3, false),

  -- Curioso: Essencial → Fugir do Óbvio → Ícones
  ('curioso',     'Essencial',      1, true),
  ('curioso',     'Fugir do óbvio', 2, true),
  ('curioso',     'Ícones',         3, true),

  -- Desbravador: Fugir do Óbvio → Essencial → Ícones
  ('desbravador', 'Fugir do óbvio', 1, true),
  ('desbravador', 'Essencial',      2, true),
  ('desbravador', 'Ícones',         3, true),

  -- Curador: Fugir do Óbvio → Ícones → Essencial
  ('curador',     'Fugir do óbvio', 1, true),
  ('curador',     'Ícones',         2, true),
  ('curador',     'Essencial',      3, true),

  -- Expert: Ícones → Fugir do Óbvio → Essencial
  ('expert',      'Ícones',         1, true),
  ('expert',      'Fugir do óbvio', 2, true),
  ('expert',      'Essencial',      3, true)

ON CONFLICT ON CONSTRAINT profile_content_rules_unique DO NOTHING;
