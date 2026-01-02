-- ============================================
-- CLINIC MANAGEMENT SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add clinic_id to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;

-- 3. Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'assistant')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 5. Clinics policies
DROP POLICY IF EXISTS "Super admins can do everything with clinics" ON clinics;
CREATE POLICY "Super admins can do everything with clinics" ON clinics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "Clinic admins can view own clinic" ON clinics;
CREATE POLICY "Clinic admins can view own clinic" ON clinics
  FOR SELECT USING (
    id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())
  );

-- 6. Invitations policies
DROP POLICY IF EXISTS "Clinic admins can manage invitations" ON invitations;
CREATE POLICY "Clinic admins can manage invitations" ON invitations
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('super_admin', 'clinic_admin')
    )
  );

-- 7. Update profiles policy for clinic access
DROP POLICY IF EXISTS "Users can read profiles in same clinic" ON profiles;
CREATE POLICY "Users can read profiles in same clinic" ON profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- 8. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON profiles(clinic_id);

-- Done! Now run your Express server.
