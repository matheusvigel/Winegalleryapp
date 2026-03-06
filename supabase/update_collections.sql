-- ============================================================
-- Update collections: add background_image and content_type
-- Execute in Supabase SQL Editor
-- ============================================================

alter table collections
  add column if not exists background_image text,
  add column if not exists content_type text not null default 'mix'
    check (content_type in ('wines', 'wineries', 'experiences', 'grapes', 'mix'));
