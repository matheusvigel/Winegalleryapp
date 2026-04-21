-- ═══════════════════════════════════════════════════════════════════
-- Migration: Quiz Simplification + Wine Profiles + App Settings
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Simplify quiz_options: remove weight ───────────────────────
ALTER TABLE quiz_options DROP COLUMN IF EXISTS weight;

-- ── 2. Simplify quiz_questions: remove flow, add bonus_points ─────
ALTER TABLE quiz_questions DROP COLUMN IF EXISTS flow;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS bonus_points INT NOT NULL DEFAULT 0;

-- ── 3. Wine Profiles table ────────────────────────────────────────
--   5 fixed profiles editable by admin (label, archetype, tagline, emoji, description)
CREATE TABLE IF NOT EXISTS wine_profiles (
  id          TEXT        PRIMARY KEY,  -- novato | curioso | desbravador | curador | expert
  label       TEXT,
  archetype   TEXT,
  tagline     TEXT,
  emoji       TEXT,
  description TEXT,
  order_index INT         NOT NULL DEFAULT 1,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO wine_profiles (id, label, archetype, tagline, emoji, order_index, description) VALUES
  ('novato',      'Iniciante Curioso',    'O Descobridor',      'Todo grande sommelier já foi um novato apaixonado.',          '🌱', 1, 'Você está no início de uma jornada fascinante. Cada taça é uma nova descoberta. Aproveite cada gole sem pressa.'),
  ('curioso',     'Aprendiz Apaixonado',  'O Explorador',       'A curiosidade é o melhor sommelier que existe.',              '🔍', 2, 'Você já sabe o básico e quer ir além. Está construindo seu vocabulário do vinho e adorando cada aula.'),
  ('desbravador', 'Aventureiro do Vinho', 'O Desbravador',      'Os melhores vinhos ainda estão por ser descobertos.',         '🗺️', 3, 'Você busca o incomum e o surpreendente. Rótulos desconhecidos te atraem mais do que os clássicos.'),
  ('curador',     'Colecionador Refinado','O Curador',          'A arte do vinho está nos detalhes que poucos percebem.',      '🏆', 4, 'Você tem paladar aguçado e cuida de cada experiência com atenção e elegância. Cada rótulo conta uma história.'),
  ('expert',      'Sommelier em Essência','O Expert',           'O vinho é uma janela para a alma da terra onde nasceu.',      '⭐', 5, 'Você vive e respira vinho. Sua jornada é de profundo conhecimento e paixão inesgotável.')
ON CONFLICT (id) DO NOTHING;

-- ── 4. App Settings ───────────────────────────────────────────────
--   Key/value store for admin-configurable values
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
  ('quiz_completion_points', '20')
ON CONFLICT (key) DO NOTHING;

-- ── 5. Quiz Bonus Answers ─────────────────────────────────────────
--   Tracks which users answered bonus questions (new questions added after initial quiz)
CREATE TABLE IF NOT EXISTS quiz_bonus_answers (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL,
  question_id   UUID        NOT NULL,
  option_id     UUID        NOT NULL,
  profile_key   TEXT        NOT NULL,
  points_earned INT         NOT NULL DEFAULT 0,
  answered_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, question_id)
);

-- ── 6. Note: total_points already exists in user_profiles ────────────────────────
-- (created by add_profile_quiz_system.sql — nothing to add here)
