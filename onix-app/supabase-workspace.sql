-- ============================================================
-- ONIX AI — Workspace Table Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS workspaces (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL DEFAULT 'My Workspace',
  description   TEXT,
  company       TEXT,
  industry      TEXT,
  website       TEXT,
  size          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  role          TEXT DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','active')),
  invited_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE workspaces         ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage workspace"
  ON workspaces FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Members can view workspace"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can manage members"
  ON workspace_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = workspace_members.workspace_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can view other members"
  ON workspace_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid()
    )
  );

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS workspaces_owner_id_idx       ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS workspace_members_ws_id_idx   ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_members_user_id_idx ON workspace_members(user_id);
