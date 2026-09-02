-- ============================================================
-- ONIX AI — Outreach Table Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS outreach (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deal_id        UUID REFERENCES deals(id) ON DELETE SET NULL,
  contact_name   TEXT NOT NULL,
  contact_email  TEXT,
  subject        TEXT,
  message        TEXT,
  status         TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','replied','no_response','meeting_scheduled')),
  sent_at        TIMESTAMPTZ,
  replied_at     TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outreach"
  ON outreach FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outreach"
  ON outreach FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outreach"
  ON outreach FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outreach"
  ON outreach FOR DELETE USING (auth.uid() = user_id);

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS outreach_user_id_idx  ON outreach(user_id);
CREATE INDEX IF NOT EXISTS outreach_deal_id_idx  ON outreach(deal_id);
CREATE INDEX IF NOT EXISTS outreach_status_idx   ON outreach(status);
CREATE INDEX IF NOT EXISTS outreach_sent_at_idx  ON outreach(sent_at);