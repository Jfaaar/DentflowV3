-- ============================================
-- PHONE AUTHENTICATION SUPPORT
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add phone column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

-- 2. Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- 3. Update profiles RLS to allow phone-based lookups
-- (Existing policies should work, just adding phone column)

-- Done! Phone authentication is now supported.
