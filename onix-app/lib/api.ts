import { createClient } from './supabase/client';

/* ── Types ── */

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  company: string;
  industry: string;
  website: string;
  size: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active';
  invited_at: string;
}

export interface Outreach {
  id: string;
  user_id: string;
  deal_id: string | null;
  deal_name?: string;
  contact_name: string;
  contact_email: string;
  subject: string;
  message: string;
  status: 'draft' | 'sent' | 'replied' | 'no_response' | 'meeting_scheduled';
  sent_at: string | null;
  replied_at: string | null;
  notes: string;
  created_at: string;
}

export interface Investor {
  id: string;
  user_id: string | null;
  name: string;
  firm: string;
  focus_sector: string;
  ticket_size: string;
  stage_preference: string;
  location: string;
  contact_email: string;
  website: string;
  notes: string;
  is_platform: boolean;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Deal {
  id: string;
  user_id: string;
  name: string;
  sector: string;
  stage: string;
  value: string;
  fit_score: number;
  assigned_agent: string;
  status: 'active' | 'pending' | 'closed';
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface DashboardData {
  metrics: {
    activeDeals: number;
    activeDealsChange: number;
    totalValue: string;
    totalValueChange: number;
    avgFitScore: number;
    avgFitScoreChange: number;
    closedThisMonth: number;
    closedThisMonthChange: number;
  };
  stages: { label: string; count: number }[];
  recentDeals: Deal[];
  readiness: {
    overall: number;
    categories: { label: string; score: number }[];
  };
  activity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  message: string;
  time: string;
  type: 'deal' | 'investor' | 'ai' | 'stage';
}

const STAGES = ['Diagnose', 'Prepare', 'Match', 'Outreach', 'Close'];

/* ── Deals ── */

export async function fetchDeals(): Promise<Deal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createDeal(payload: Partial<Deal>): Promise<Deal> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('deals')
    .insert([{ ...payload, user_id: user?.id, fit_score: 0, status: 'active' }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function advanceDeal(id: string): Promise<Deal> {
  const supabase = createClient();

  // Get current deal
  const { data: deal, error: fetchErr } = await supabase
    .from('deals')
    .select('stage')
    .eq('id', id)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const currentIdx = STAGES.indexOf(deal.stage);
  const nextStage = STAGES[Math.min(currentIdx + 1, STAGES.length - 1)];

  const { data, error } = await supabase
    .from('deals')
    .update({ stage: nextStage, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/* ── Investment Readiness (dynamic, computed from deals) ── */

function computeReadiness(deals: Deal[]) {
  const active = deals.filter(d => d.status === 'active');
  const total = active.length;

  // Financial Docs: % of active deals that have a monetary value set
  const withValue = active.filter(d => d.value && d.value > 0).length;
  const financialDocs = total ? Math.round((withValue / total) * 100) : 0;

  // Market Positioning: % of active deals in Match, Outreach, or Close stage
  const marketStages = ['Match', 'Outreach', 'Close'];
  const inMarket = active.filter(d => marketStages.includes(d.stage)).length;
  const marketPositioning = total ? Math.round((inMarket / total) * 100) : 0;

  // Legal Readiness: % of active deals in Outreach or Close stage
  const legalStages = ['Outreach', 'Close'];
  const inLegal = active.filter(d => legalStages.includes(d.stage)).length;
  const legalReadiness = total ? Math.round((inLegal / total) * 100) : 0;

  // Team & Operations: average fit score across active deals (proxy for team/ops quality)
  const avgFit = total
    ? Math.round(active.reduce((s, d) => s + (d.fit_score ?? 0), 0) / total)
    : 0;

  // Overall: weighted average
  const overall = total
    ? Math.round(financialDocs * 0.3 + marketPositioning * 0.25 + legalReadiness * 0.2 + avgFit * 0.25)
    : 0;

  return {
    overall,
    categories: [
      { label: 'Financial Docs',     score: financialDocs },
      { label: 'Market Positioning', score: marketPositioning },
      { label: 'Legal Readiness',    score: legalReadiness },
      { label: 'Team & Operations',  score: avgFit },
    ],
  };
}

/* ── Dashboard (computed from deals) ── */

export async function fetchDashboard(): Promise<DashboardData> {
  const supabase = createClient();

  const { data: deals, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const allDeals: Deal[] = deals ?? [];
  const active = allDeals.filter(d => d.status === 'active');
  const closed = allDeals.filter(d => d.status === 'closed');
  const avgFit = active.length
    ? Math.round(active.reduce((s, d) => s + (d.fit_score ?? 0), 0) / active.length)
    : 0;

  const stageCounts = STAGES.map(label => ({
    label,
    count: allDeals.filter(d => d.stage === label).length,
  }));

  return {
    metrics: {
      activeDeals: active.length,
      activeDealsChange: 8,
      totalValue: `${allDeals.length * 2.4}M`,
      totalValueChange: 12,
      avgFitScore: avgFit,
      avgFitScoreChange: 3,
      closedThisMonth: closed.length,
      closedThisMonthChange: -2,
    },
    stages: stageCounts,
    recentDeals: allDeals.slice(0, 5),
    readiness: computeReadiness(allDeals),
    activity: allDeals.slice(0, 5).map(d => ({
      id: d.id,
      message: `Deal "${d.name}" is in ${d.stage} stage`,
      time: new Date(d.created_at).toLocaleDateString(),
      type: 'deal',
    })),
  };
}

/* ── Investors ── */

export async function fetchInvestors(): Promise<Investor[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch platform investors + user's own investors
  const { data, error } = await supabase
    .from('investors')
    .select('*')
    .or(`is_platform.eq.true,user_id.eq.${user?.id}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createInvestor(payload: Partial<Investor>): Promise<Investor> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('investors')
    .insert([{ ...payload, user_id: user?.id, is_platform: false, status: 'active' }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteInvestor(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('investors').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ── Outreach ── */

export async function fetchOutreach(): Promise<Outreach[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('outreach')
    .select('*, deals(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Outreach & { deals?: { name: string } | null }) => ({
    ...row,
    deal_name: row.deals?.name ?? '—',
  }));
}

export async function createOutreach(payload: Partial<Outreach>): Promise<Outreach> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('outreach')
    .insert([{ ...payload, user_id: user?.id }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateOutreachStatus(id: string, status: Outreach['status']): Promise<Outreach> {
  const supabase = createClient();
  const updates: Partial<Outreach> = {
    status,
    updated_at: new Date().toISOString(),
    ...(status === 'sent'    ? { sent_at:    new Date().toISOString() } : {}),
    ...(status === 'replied' ? { replied_at: new Date().toISOString() } : {}),
  } as Partial<Outreach>;

  const { data, error } = await supabase
    .from('outreach')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteOutreach(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('outreach').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ── Workspace ── */

export async function fetchWorkspace(): Promise<Workspace | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  return data ?? null;
}

export async function upsertWorkspace(payload: Partial<Workspace>): Promise<Workspace> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const existing = await fetchWorkspace();

  if (existing) {
    const { data, error } = await supabase
      .from('workspaces')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  } else {
    const { data, error } = await supabase
      .from('workspaces')
      .insert([{ ...payload, owner_id: user.id }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export async function fetchWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('invited_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function inviteMember(workspaceId: string, email: string, role: WorkspaceMember['role']): Promise<WorkspaceMember> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('workspace_members')
    .insert([{ workspace_id: workspaceId, email, role, status: 'pending' }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function removeMember(memberId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('workspace_members').delete().eq('id', memberId);
  if (error) throw new Error(error.message);
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId);
  if (error) throw new Error(error.message);
}

/* ── Copilot Chats ── */

export interface CopilotMessage {
  id:      string;
  role:    'user' | 'assistant';
  content: string;
}

export interface CopilotChat {
  id:         string;
  user_id:    string;
  title:      string;
  messages:   CopilotMessage[];
  created_at: string;
  updated_at: string;
}

export async function fetchCopilotChats(): Promise<CopilotChat[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('copilot_chats')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCopilotChat(title: string, messages: CopilotMessage[]): Promise<CopilotChat> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('copilot_chats')
    .insert({ title, messages, user_id: user?.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCopilotChat(id: string, messages: CopilotMessage[], title?: string): Promise<void> {
  const supabase = createClient();
  const update: Record<string, unknown> = { messages, updated_at: new Date().toISOString() };
  if (title) update.title = title;
  const { error } = await supabase.from('copilot_chats').update(update).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCopilotChat(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('copilot_chats').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
