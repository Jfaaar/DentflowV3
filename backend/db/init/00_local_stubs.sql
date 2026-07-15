-- Local Postgres bootstrap — runs before any 0001+ migration.
--
-- The Dentflow schema was authored for Supabase, so it depends on:
--   • the `auth` schema (auth.users, auth.uid()) — used by foreign keys
--     and by every RLS policy
--   • the `storage` schema (skipped: migration 0004 is not mounted)
--
-- This file creates just enough of those to let the existing migrations
-- apply cleanly on a vanilla postgres:16 container, with one fixed dev
-- identity baked in so RLS policies stop being a developer obstacle.
--
-- Dev identity:
--   user id    : 00000000-0000-0000-0000-000000000001
--   clinic id  : 00000000-0000-0000-0000-0000000000c1
--   role       : clinic_admin
-- The corresponding profile + clinic rows are inserted in 99_dev_seed.sql,
-- which runs after the migrations have created the profiles/clinics tables.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id           UUID PRIMARY KEY,
  email        TEXT,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Stub helpers used by RLS policies and trigger functions.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID
  LANGUAGE sql STABLE
  AS $$ SELECT '00000000-0000-0000-0000-000000000001'::uuid $$;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT
  LANGUAGE sql STABLE
  AS $$ SELECT 'authenticated' $$;

CREATE OR REPLACE FUNCTION auth.email() RETURNS TEXT
  LANGUAGE sql STABLE
  AS $$ SELECT 'demo@dentflow.local' $$;

-- Seed the dev auth user up front. profiles.id has a FK to auth.users(id),
-- so this row must exist before 99_dev_seed.sql can create the profile.
INSERT INTO auth.users (id, email)
  VALUES ('00000000-0000-0000-0000-000000000001', 'demo@dentflow.local')
  ON CONFLICT (id) DO NOTHING;
