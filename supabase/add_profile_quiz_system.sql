-- ============================================================
-- Wine Gallery — Profile & Quiz System Migration
-- Execute in Supabase SQL Editor (idempotent)
-- ============================================================

-- ── ENUMS ────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE wine_profile_type AS ENUM (
    'novato', 'curioso', 'desbravador', 'curador', 'expert'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_level_type AS ENUM (
    'recem_chegado', 'em_ascensao', 'destaque', 'embaixador'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_app_type AS ENUM ('normal', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE points_action_type AS ENUM (
    'tried', 'favorite', 'review', 'photo', 'brotherhood_join', 'follow'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── QUIZ QUESTIONS ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quiz_questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow        text NOT NULL CHECK (flow IN ('situacoes', 'habitos', 'conexao')),
  position    integer NOT NULL DEFAULT 0,
  question    text NOT NULL,
  context     text,           -- ex: "Cenário: em casa"
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_active   ON quiz_questions(active);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_position ON quiz_questions(position);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read quiz_questions"  ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "Auth write quiz_questions"   ON quiz_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── QUIZ OPTIONS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quiz_options (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  uuid NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  letter       char(1) NOT NULL CHECK (letter IN ('a','b','c','d','e')),
  option_text  text NOT NULL,
  profile_key  wine_profile_type NOT NULL,
  weight       integer NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 5),
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON quiz_options(question_id);

ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read quiz_options"  ON quiz_options FOR SELECT USING (true);
CREATE POLICY "Auth write quiz_options"   ON quiz_options FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── EXTEND user_profiles ─────────────────────────────────────

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS wine_profile      wine_profile_type NOT NULL DEFAULT 'novato',
  ADD COLUMN IF NOT EXISTS profile_score     integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_composition jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_points      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_level        user_level_type NOT NULL DEFAULT 'recem_chegado',
  ADD COLUMN IF NOT EXISTS user_type         user_app_type NOT NULL DEFAULT 'normal',
  -- tracks how many "next profile" items consumed toward upgrade
  ADD COLUMN IF NOT EXISTS next_profile_count integer NOT NULL DEFAULT 0,
  -- quiz completed flag
  ADD COLUMN IF NOT EXISTS quiz_completed    boolean NOT NULL DEFAULT false;

-- ── PROFILE AFFINITY on content tables ───────────────────────
-- Default mapping: Essencial→curioso, Fugir do óbvio→desbravador, Ícones→curador
-- Admin can override per-item in backoffice.

ALTER TABLE wines
  ADD COLUMN IF NOT EXISTS profile_affinity wine_profile_type;

ALTER TABLE wineries
  ADD COLUMN IF NOT EXISTS profile_affinity wine_profile_type;

ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS profile_affinity wine_profile_type;

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS profile_affinity wine_profile_type;

-- ── USER POINTS LOG ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_points_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type points_action_type NOT NULL,
  item_id     text,
  item_type   text,
  points      integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_points_log_user_id ON user_points_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_log_created ON user_points_log(created_at);

ALTER TABLE user_points_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own points log"   ON user_points_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own points log" ON user_points_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── PROFILE UPGRADE SETTINGS ─────────────────────────────────
-- Single-row config table for tuneable thresholds (admin editable)

CREATE TABLE IF NOT EXISTS app_settings (
  key   text PRIMARY KEY,
  value text NOT NULL,
  label text
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read app_settings"  ON app_settings FOR SELECT USING (true);
CREATE POLICY "Auth write app_settings"   ON app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO app_settings (key, value, label) VALUES
  ('profile_upgrade_threshold', '5',  'Nº de itens do próximo perfil para subir de perfil'),
  ('level_recem_chegado_max',   '29', 'Pontos máx. — Recém chegado'),
  ('level_em_ascensao_max',     '99', 'Pontos máx. — Em ascensão'),
  ('level_destaque_max',        '299','Pontos máx. — Destaque')
ON CONFLICT (key) DO NOTHING;

-- ── UPDATED_AT TRIGGER for quiz_questions ─────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
