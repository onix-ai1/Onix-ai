-- ============================================================
-- ONIX AI — Investors Table Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS investors (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = platform investor
  name             TEXT NOT NULL,
  firm             TEXT,
  focus_sector     TEXT,
  ticket_size      TEXT,
  stage_preference TEXT,
  location         TEXT,
  contact_email    TEXT,
  website          TEXT,
  notes            TEXT,
  is_platform      BOOLEAN DEFAULT FALSE,  -- TRUE = pre-loaded by ONIX AI
  status           TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

-- Platform investors are visible to all authenticated users
CREATE POLICY "Authenticated users can view platform investors"
  ON investors FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_platform = TRUE);

-- Users can view their own added investors
CREATE POLICY "Users can view own investors"
  ON investors FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own investors
CREATE POLICY "Users can insert own investors"
  ON investors FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_platform = FALSE);

-- Users can update their own investors
CREATE POLICY "Users can update own investors"
  ON investors FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own investors
CREATE POLICY "Users can delete own investors"
  ON investors FOR DELETE
  USING (auth.uid() = user_id);

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS investors_user_id_idx      ON investors(user_id);
CREATE INDEX IF NOT EXISTS investors_is_platform_idx  ON investors(is_platform);
CREATE INDEX IF NOT EXISTS investors_focus_sector_idx ON investors(focus_sector);

-- ── Seed Data (Platform Investors) ─────────────────────────
-- These are visible to all users as reference investors

INSERT INTO investors (name, firm, focus_sector, ticket_size, stage_preference, location, contact_email, website, is_platform, status) VALUES
  ('Arjun Mehta',      'Sequoia India',         'Technology',     '$5M – $20M',   'Series A',  'Mumbai, IN',       'arjun@sequoiaindia.com',  'sequoiacap.com',    TRUE, 'active'),
  ('Priya Nair',       'Accel Partners',         'SaaS / Fintech', '$1M – $10M',   'Seed',      'Bangalore, IN',    'priya@accel.com',         'accel.com',         TRUE, 'active'),
  ('James Thornton',   'Tiger Global',           'E-Commerce',     '$10M – $50M',  'Series B',  'New York, US',     'j.thornton@tigerglobal.com','tigerglobal.com', TRUE, 'active'),
  ('Fatima Al-Rashid', 'STV',                    'MENA Startups',  '$2M – $15M',   'Series A',  'Dubai, UAE',       'fatima@stv.vc',           'stv.vc',            TRUE, 'active'),
  ('Wei Chen',         'GGV Capital',            'Consumer Tech',  '$5M – $30M',   'Series B',  'Singapore',        'wchen@ggvc.com',          'ggvc.com',          TRUE, 'active'),
  ('Sarah Okonkwo',    'Novastar Ventures',      'Healthcare',     '$500K – $5M',  'Seed',      'Nairobi, KE',      'sarah@novastarventures.com','novastarventures.com',TRUE,'active'),
  ('Raj Kapoor',       'Kalaari Capital',        'D2C / Retail',   '$1M – $8M',    'Seed',      'Bangalore, IN',    'raj@kalaari.com',         'kalaari.com',       TRUE, 'active'),
  ('Elena Sorokina',   'DST Global',             'Marketplace',    '$20M – $100M', 'Series C+', 'London, UK',       'e.sorokina@dst.global',   'dst.global',        TRUE, 'active'),
  ('Omar Shaikh',      '500 Global',             'Manufacturing',  '$250K – $2M',  'Pre-Seed',  'Karachi, PK',      'omar@500.co',             '500.co',            TRUE, 'active'),
  ('Mei Lin',          'Lightspeed India',       'AI / ML',        '$3M – $20M',   'Series A',  'Delhi, IN',        'meilin@lsvp.com',         'lsvp.com',          TRUE, 'active'),
  ('Carlos Rivera',    'SoftBank Vision Fund',   'Real Estate',    '$50M – $200M', 'Growth',    'São Paulo, BR',    'crivera@softbank.com',    'softbank.com',      TRUE, 'active'),
  ('Aisha Kamara',     'Partech Africa',         'Fintech',        '$1M – $10M',   'Series A',  'Dakar, SN',        'aisha@partechpartners.com','partechpartners.com',TRUE,'active');
