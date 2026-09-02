'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  fetchWorkspace,
  upsertWorkspace,
  fetchWorkspaceMembers,
  inviteMember,
  removeMember,
  deleteWorkspace,
  Workspace,
  WorkspaceMember,
} from '@/lib/api';

/* ── Types ─────────────────────────────────────────────────────────── */
type Role = WorkspaceMember['role'];

const INDUSTRIES = [
  'Technology & SaaS', 'Healthcare & Life Sciences', 'Financial Services',
  'Real Estate', 'Energy & Infrastructure', 'Manufacturing',
  'Consumer & Retail', 'Media & Entertainment', 'Education',
  'Transportation', 'Agriculture', 'Other',
];

const SIZES = ['Solo / 1 person', '2–10', '11–50', '51–200', '200+'];

/* ── Workspace Page ─────────────────────────────────────────────────── */
export default function WorkspacePage() {
  const qc     = useQueryClient();
  const router = useRouter();

  const { data: workspace, isLoading: wsLoading } = useQuery({
    queryKey: ['workspace'],
    queryFn: fetchWorkspace,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['workspace-members', workspace?.id],
    queryFn: () => fetchWorkspaceMembers(workspace!.id),
    enabled: !!workspace?.id,
  });

  const [form, setForm] = useState<Partial<Workspace>>({});
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  // Sync workspace data into form when query resolves
  useEffect(() => {
    if (workspace) {
      setForm({
        name:        workspace.name        ?? '',
        description: workspace.description ?? '',
        company:     workspace.company     ?? '',
        industry:    workspace.industry    ?? '',
        website:     workspace.website     ?? '',
        size:        workspace.size        ?? '',
      });
    }
  }, [workspace]);

  const upsertMutation = useMutation({
    mutationFn: (payload: Partial<Workspace>) => upsertWorkspace(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace'] });
      setSaved(true);
      setSaveError('');
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err: Error) => {
      setSaveError(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspace-members', workspace?.id] }),
  });

  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError]   = useState('');

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkspace(workspace!.id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['workspace'] });
      router.push('/dashboard');
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  function handleInput(key: keyof Workspace, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
    setSaveError('');
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    upsertMutation.mutate(form);
  }

  if (wsLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--onix-gold)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--onix-text)' }}>Workspace Settings</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--onix-muted)' }}>
          Manage your organisation details and team members.
        </p>
      </div>

      {/* ── Organisation Details ── */}
      <section
        className="rounded-xl p-6"
        style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--onix-text)' }}>Organisation Details</h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Workspace Name"
              value={form.name ?? ''}
              onChange={v => handleInput('name', v)}
              placeholder="My Workspace"
              required
            />
            <Field
              label="Company Name"
              value={form.company ?? ''}
              onChange={v => handleInput('company', v)}
              placeholder="Acme Corp"
            />
          </div>

          <Field
            label="Description"
            value={form.description ?? ''}
            onChange={v => handleInput('description', v)}
            placeholder="Briefly describe your company or fund…"
            multiline
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Industry"
              value={form.industry ?? ''}
              options={INDUSTRIES}
              onChange={v => handleInput('industry', v)}
            />
            <SelectField
              label="Team Size"
              value={form.size ?? ''}
              options={SIZES}
              onChange={v => handleInput('size', v)}
            />
          </div>

          <Field
            label="Website"
            value={form.website ?? ''}
            onChange={v => handleInput('website', v)}
            placeholder="https://example.com"
            type="url"
          />

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={upsertMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'var(--onix-gold)',
                color: '#0D0D0D',
                opacity: upsertMutation.isPending ? 0.6 : 1,
              }}
            >
              {upsertMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && (
              <span className="text-sm" style={{ color: 'var(--onix-gold)' }}>
                ✓ Saved
              </span>
            )}
            {saveError && (
              <span className="text-sm" style={{ color: '#EF4444' }}>
                {saveError}
              </span>
            )}
          </div>
        </form>
      </section>

      {/* ── Team Members ── */}
      <section
        className="rounded-xl p-6"
        style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>Team Members</h3>
          {workspace && (
            <button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
            >
              + Invite Member
            </button>
          )}
        </div>

        {!workspace && (
          <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>
            Save your workspace details first to manage team members.
          </p>
        )}

        {workspace && membersLoading && (
          <div className="flex items-center gap-2 py-4">
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--onix-gold)', borderTopColor: 'transparent' }} />
            <span className="text-sm" style={{ color: 'var(--onix-muted)' }}>Loading members…</span>
          </div>
        )}

        {workspace && !membersLoading && members.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>No team members yet. Invite someone to collaborate.</p>
          </div>
        )}

        {workspace && !membersLoading && members.length > 0 && (
          <div className="divide-y" style={{ borderColor: 'var(--onix-border)' }}>
            {/* Owner row */}
            <MemberRow
              email={workspace.owner_id}
              role="owner"
              status="active"
              isOwner
              onRemove={() => {}}
            />
            {members.map(m => (
              <MemberRow
                key={m.id}
                email={m.email}
                role={m.role}
                status={m.status}
                isOwner={false}
                onRemove={() => removeMutation.mutate(m.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Danger Zone ── */}
      <section
        className="rounded-xl p-6"
        style={{ background: 'var(--onix-card)', border: '1px solid #EF444430' }}
      >
        <h3 className="text-sm font-semibold mb-1" style={{ color: '#EF4444' }}>Danger Zone</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--onix-muted)' }}>
          Deleting your workspace is permanent and cannot be undone. All members and data will be removed.
        </p>
        <button
          className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ border: '1px solid #EF4444', color: '#EF4444', background: 'transparent' }}
          onClick={() => { setDeleteOpen(true); setDeleteConfirm(''); setDeleteError(''); }}
        >
          Delete Workspace
        </button>
      </section>

      {/* ── Delete Confirmation Modal ── */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteOpen(false); }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md mx-4"
            style={{ background: 'var(--onix-surface)', border: '1px solid #EF444450' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)' }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>Delete Workspace</h3>
                <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>This action cannot be undone</p>
              </div>
            </div>

            {!workspace ? (
              <>
                <p className="text-sm mb-4" style={{ color: 'var(--onix-muted)' }}>
                  No workspace found. Save your workspace details first before deleting.
                </p>
                <button
                  onClick={() => setDeleteOpen(false)}
                  className="w-full py-2 rounded-lg text-sm font-medium"
                  style={{ border: '1px solid var(--onix-border)', color: 'var(--onix-muted)', background: 'transparent' }}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <p className="text-sm mb-4" style={{ color: 'var(--onix-muted)' }}>
                  Type <strong style={{ color: 'var(--onix-text)' }}>{workspace.name}</strong> to confirm deletion.
                </p>

                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
                  placeholder={workspace.name}
                  style={{
                    background: 'var(--onix-card)', border: '1px solid var(--onix-border)',
                    color: 'var(--onix-text)', borderRadius: '8px', padding: '8px 12px',
                    fontSize: '14px', width: '100%', outline: 'none', marginBottom: '12px',
                  }}
                />

                {deleteError && (
                  <p className="text-xs mb-3" style={{ color: '#EF4444' }}>{deleteError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteOpen(false)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium"
                    style={{ border: '1px solid var(--onix-border)', color: 'var(--onix-muted)', background: 'transparent' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirm !== workspace.name) {
                        setDeleteError('Workspace name does not match.');
                        return;
                      }
                      deleteMutation.mutate();
                    }}
                    disabled={deleteMutation.isPending}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: '#EF4444', color: '#fff',
                      opacity: deleteMutation.isPending ? 0.6 : 1,
                    }}
                  >
                    {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Invite Modal ── */}
      {inviteOpen && workspace && (
        <InviteModal
          workspaceId={workspace.id}
          onClose={() => setInviteOpen(false)}
          onInvited={() => {
            qc.invalidateQueries({ queryKey: ['workspace-members', workspace.id] });
            setInviteOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────── */

function Field({
  label, value, onChange, placeholder, required, multiline, type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
}) {
  const base: React.CSSProperties = {
    background:  'var(--onix-surface)',
    border:      '1px solid var(--onix-border)',
    color:       'var(--onix-text)',
    borderRadius: '8px',
    padding:     '8px 12px',
    fontSize:    '14px',
    width:       '100%',
    outline:     'none',
  };
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--onix-muted)' }}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...base, resize: 'vertical' }}
        />
      ) : (
        <input
          type={type ?? 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={base}
        />
      )}
    </div>
  );
}

function SelectField({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--onix-muted)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background:  'var(--onix-surface)',
          border:      '1px solid var(--onix-border)',
          color:       'var(--onix-text)',
          borderRadius: '8px',
          padding:     '8px 12px',
          fontSize:    '14px',
          width:       '100%',
          outline:     'none',
        }}
      >
        <option value="">Select…</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function MemberRow({
  email, role, status, isOwner, onRemove,
}: {
  email: string;
  role: Role;
  status: string;
  isOwner: boolean;
  onRemove: () => void;
}) {
  const initials = email.slice(0, 2).toUpperCase();
  const roleColors: Record<string, string> = {
    owner:  'var(--onix-gold)',
    admin:  '#818CF8',
    member: 'var(--onix-muted)',
  };

  return (
    <div className="flex items-center justify-between py-3 gap-3">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
          style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--onix-text)' }}>
            {isOwner ? email : email}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs capitalize font-medium" style={{ color: roleColors[role] ?? 'var(--onix-muted)' }}>
              {role}
            </span>
            {status === 'pending' && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}
              >
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {!isOwner && (
        <button
          onClick={onRemove}
          className="text-xs px-2 py-1 rounded transition-all"
          style={{ color: '#EF4444', border: '1px solid #EF444430' }}
        >
          Remove
        </button>
      )}
    </div>
  );
}

function InviteModal({
  workspaceId, onClose, onInvited,
}: {
  workspaceId: string;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState<Role>('member');
  const [error, setError] = useState('');

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(workspaceId, email, role),
    onSuccess: onInvited,
    onError:   (err: Error) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    setError('');
    inviteMutation.mutate();
  }

  const inputStyle: React.CSSProperties = {
    background:   'var(--onix-surface)',
    border:       '1px solid var(--onix-border)',
    color:        'var(--onix-text)',
    borderRadius: '8px',
    padding:      '8px 12px',
    fontSize:     '14px',
    width:        '100%',
    outline:      'none',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl p-6 w-full max-w-md mx-4"
        style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold" style={{ color: 'var(--onix-text)' }}>Invite Team Member</h3>
          <button onClick={onClose} style={{ color: 'var(--onix-muted)', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--onix-muted)' }}>
              Email Address <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--onix-muted)' }}>Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as Role)}
              style={inputStyle}
            >
              <option value="member">Member — view and comment</option>
              <option value="admin">Admin — full edit access</option>
            </select>
          </div>

          {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ border: '1px solid var(--onix-border)', color: 'var(--onix-muted)', background: 'transparent' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'var(--onix-gold)', color: '#0D0D0D', opacity: inviteMutation.isPending ? 0.6 : 1 }}
            >
              {inviteMutation.isPending ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
