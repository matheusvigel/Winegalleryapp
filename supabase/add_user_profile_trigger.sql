-- ============================================================
-- Migration: user_profiles auto-creation trigger + admin seed
-- Depende de add_profile_quiz_system.sql já aplicado.
-- Execute in Supabase SQL Editor.
-- ============================================================

-- ── Add email to user_profiles ────────────────────────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email text;

-- ── Trigger: auto-create profile on signup ────────────────────
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    user_id,
    display_name,
    email,
    user_type,
    wine_profile,
    user_level,
    total_points,
    quiz_completed
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    'normal',
    'novato',
    'recem_chegado',
    0,
    false
  )
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email;   -- keep email in sync if user already has a profile
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile_on_signup();

-- ── Backfill emails for existing users ───────────────────────
-- Updates user_profiles.email for any users already in auth.users
UPDATE user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.user_id = au.id
  AND (up.email IS NULL OR up.email = '');

-- ── Create profiles for existing auth users without one ───────
INSERT INTO user_profiles (user_id, display_name, email, user_type, wine_profile, user_level)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', ''),
  au.email,
  'normal',
  'novato',
  'recem_chegado'
FROM auth.users au
LEFT JOIN user_profiles up ON up.user_id = au.id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ── Seed admin user ───────────────────────────────────────────
-- Sets matheus@wine-locals.com as admin (upsert — safe to re-run)
INSERT INTO user_profiles (user_id, display_name, email, user_type, wine_profile, user_level)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', 'Matheus'),
  email,
  'admin',
  'curador',
  'embaixador'
FROM auth.users
WHERE email = 'matheus@wine-locals.com'
ON CONFLICT (user_id) DO UPDATE
  SET user_type = 'admin',
      email     = EXCLUDED.email;
