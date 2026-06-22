-- Nexus Club OS - Supabase Schema
-- Run this entire script in Supabase SQL Editor

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'president', 'member')),
  department TEXT,
  join_date TIMESTAMPTZ DEFAULT now(),
  contribution INTEGER DEFAULT 0,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Active', 'Pending', 'Inactive')),
  president_id TEXT NOT NULL,
  members_count INTEGER DEFAULT 1,
  image TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('Club Registration', 'Venue Booking', 'Budget Request')),
  applicant_id TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Approved', 'Rejected')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to run multiple times)
DROP POLICY IF EXISTS "Enable read for all" ON clubs;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON clubs;
DROP POLICY IF EXISTS "Enable update for authenticated" ON clubs;
DROP POLICY IF EXISTS "Enable delete for authenticated" ON clubs;
DROP POLICY IF EXISTS "Enable all for approvals" ON approvals;
DROP POLICY IF EXISTS "Enable read own" ON users;
DROP POLICY IF EXISTS "Enable insert own" ON users;
DROP POLICY IF EXISTS "Enable update own" ON users;

-- Recreate policies
CREATE POLICY "Enable read for all" ON clubs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated" ON clubs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated" ON clubs FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated" ON clubs FOR DELETE USING (true);

CREATE POLICY "Enable all for approvals" ON approvals FOR ALL USING (true);

CREATE POLICY "Enable read own" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert own" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update own" ON users FOR UPDATE USING (true);
