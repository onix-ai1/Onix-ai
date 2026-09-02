'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInvestors, createInvestor, deleteInvestor, Investor } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';

const SECTORS   = ['All', 'Technology', 'SaaS / Fintech', 'Fintech', 'E-Commerce', 'Healthcare', 'AI / ML', 'Real Estate', 'Manufacturing', 'D2C / Retail', 'Marketplace', 'Consumer Tech', 'MENA Startups', 'Other'];
const STAGES    = ['All', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth'];
const LOCATIONS = ['All', 'India', 'UAE', 'US', 'UK', 'Singapore', 'Africa', 'Other'];

export default function InvestorsPage() {
  const qc = useQueryClient();
  const [search,      setSearch]      = useState('');
  const [sector,      setSector]      = useState('All');
  const [stage,       setStage]       = useState('All');
  const [location,    setLocation]    = useState('All');
  const [showModal,   setShowModal]   = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'platform' | 'mine'>('all');

  const { data: investors = [], isLoading, isError } = useQuery({
    queryKey: ['investors'],
    queryFn: fetchInvestors,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvestor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['investors'] }),
  });

  /* ── Filtering ── */
  const filtered = investors.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      inv.name.toLowerCase().includes(q) ||
      inv.firm.toLowerCase().includes(q) ||
      inv.focus_sector?.toLowerCase().includes(q) ||
      inv.location?.toLowerCase().includes(q);

    const matchSector   = sector   === 'All' || inv.focus_sector === sector;
    const matchStage    = stage    === 'All' || inv.stage_preference === stage;
    const matchLocation = location === 'All' || inv.location?.includes(location === 'India' ? 'IN' : location === 'UAE' ? 'UAE' : location === 'US' ? 'US' : location === 'UK' ? 'UK' : location === 'Singapore' ? 'Singapore' : location === 'Africa' ? '' : '');
    const matchSource   = sourceFilter === 'all' || (sourceFilter === 'platform' ? inv.is_platform : !inv.is_platform);

    return matchSearch && matchSector && matchStage && matchSource && (location === 'All' || matchLocation);
  });

  const platformCount = investors.filter(i => i.is_platform).length;
  const myCount       = investors.filter(i => !i.is_platform).length;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--onix-text)' }}>Investors</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--onix-muted)' }}>
            {investors.length} total · {platformCount} platform · {myCount} added by you
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-semibold self-start sm:self-auto"
          style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
        >
          + Add Investor
        </button>
      </div>

      {/* ── Search + Source tabs ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, firm, sector…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
          style={{
            background: 'var(--onix-card)',
            border: '1px solid var(--onix-border)',
            color: 'var(--onix-text)',
          }}
        />
        <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--onix-border)' }}>
          {(['all', 'platform', 'mine'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className="px-4 py-2 text-xs font-medium capitalize transition-all"
              style={{
                background: sourceFilter === s ? 'var(--onix-gold)' : 'var(--onix-card)',
                color:      sourceFilter === s ? '#0D0D0D' : 'var(--onix-muted)',
              }}
            >
              {s === 'all' ? 'All' : s === 'platform' ? 'ONIX Listed' : 'My Investors'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className="flex flex-col gap-3">
        <FilterRow label="Sector"   options={SECTORS}   value={sector}   onChange={setSector}   />
        <FilterRow label="Stage"    options={STAGES}    value={stage}    onChange={setStage}    />
        <FilterRow label="Location" options={LOCATIONS} value={location} onChange={setLocation} />
      </div>

      {/* ── Error ── */}
      {isError && (
        <p className="text-sm" style={{ color: 'var(--onix-red)' }}>
          Failed to load investors. Make sure you&apos;ve run supabase-investors.sql.
        </p>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl p-5 flex flex-col gap-3" style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))
          : filtered.length === 0
          ? (
              <div className="col-span-full py-16 text-center" style={{ color: 'var(--onix-muted)' }}>
                <p className="text-sm">No investors match your filters.</p>
                <button
                  className="mt-3 text-xs underline"
                  style={{ color: 'var(--onix-gold)' }}
                  onClick={() => { setSearch(''); setSector('All'); setStage('All'); setLocation('All'); setSourceFilter('all'); }}
                >
                  Clear filters
                </button>
              </div>
            )
          : filtered.map((inv) => (
              <InvestorCard
                key={inv.id}
                investor={inv}
                onDelete={inv.is_platform ? undefined : () => deleteMutation.mutate(inv.id)}
              />
            ))
        }
      </div>

      {showModal && <AddInvestorModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

/* ── Filter row ── */
function FilterRow({ label, options, value, onChange }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium w-16 flex-shrink-0" style={{ color: 'var(--onix-muted)' }}>{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="text-xs px-3 py-1 rounded-full transition-all"
            style={{
              background: value === opt ? 'var(--onix-gold)' : 'var(--onix-card)',
              color:      value === opt ? '#0D0D0D' : 'var(--onix-muted)',
              border:     `1px solid ${value === opt ? 'var(--onix-gold)' : 'var(--onix-border)'}`,
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Investor Card ── */
function InvestorCard({ investor: inv, onDelete }: { investor: Investor; onDelete?: () => void }) {
  const initials = inv.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4 relative"
      style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}
    >
      {/* Platform badge */}
      {inv.is_platform && (
        <span
          className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--onix-gold)', border: '1px solid rgba(201,168,76,0.3)' }}
        >
          ONIX Listed
        </span>
      )}

      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--onix-gold)' }}
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>{inv.name}</p>
          <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>{inv.firm}</p>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2">
        {[
          { icon: '🎯', label: inv.focus_sector    },
          { icon: '💰', label: inv.ticket_size      },
          { icon: '📈', label: inv.stage_preference },
          { icon: '📍', label: inv.location         },
        ].filter(r => r.label).map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs">{icon}</span>
            <span className="text-xs" style={{ color: 'var(--onix-muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--onix-border)' }}>
        {inv.contact_email && (
          <a
            href={`mailto:${inv.contact_email}`}
            className="flex-1 text-center text-xs py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--onix-surface)', color: 'var(--onix-gold)', border: '1px solid var(--onix-border)' }}
          >
            Contact
          </a>
        )}
        {inv.website && (
          <a
            href={`https://${inv.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--onix-surface)', color: 'var(--onix-muted)', border: '1px solid var(--onix-border)' }}
          >
            Website ↗
          </a>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-xs py-1.5 px-3 rounded-lg transition-all"
            style={{ color: 'var(--onix-red)', border: '1px solid var(--onix-border)' }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Add Investor Modal ── */
function AddInvestorModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', firm: '', focus_sector: '', ticket_size: '',
    stage_preference: '', location: '', contact_email: '', website: '', notes: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: createInvestor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investors'] });
      onClose();
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to add investor.'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Investor name is required.'); return; }
    setError('');
    mutation.mutate(form);
  }

  const fields: { label: string; key: keyof typeof form; placeholder: string; required?: boolean }[] = [
    { label: 'Full Name',         key: 'name',             placeholder: 'John Smith',          required: true },
    { label: 'Firm / Fund',       key: 'firm',             placeholder: 'Sequoia Capital'      },
    { label: 'Focus Sector',      key: 'focus_sector',     placeholder: 'Technology, SaaS'     },
    { label: 'Ticket Size',       key: 'ticket_size',      placeholder: '$1M – $5M'            },
    { label: 'Stage Preference',  key: 'stage_preference', placeholder: 'Seed, Series A'       },
    { label: 'Location',          key: 'location',         placeholder: 'Mumbai, IN'           },
    { label: 'Contact Email',     key: 'contact_email',    placeholder: 'investor@fund.com'    },
    { label: 'Website',           key: 'website',          placeholder: 'sequoiacap.com'       },
    { label: 'Notes',             key: 'notes',            placeholder: 'Any additional notes…'},
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-7 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: 'var(--onix-text)' }}>Add Investor</h2>
          <button onClick={onClose} style={{ color: 'var(--onix-muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {fields.map(({ label, key, placeholder, required }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>
                {label}{required && <span style={{ color: 'var(--onix-red)' }}> *</span>}
              </label>
              <input
                type={key === 'contact_email' ? 'email' : 'text'}
                required={required}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'var(--onix-card)',
                  border: '1px solid var(--onix-border)',
                  color: 'var(--onix-text)',
                }}
              />
            </div>
          ))}

          {error && <p className="text-xs" style={{ color: 'var(--onix-red)' }}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--onix-card)', color: 'var(--onix-muted)', border: '1px solid var(--onix-border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
            >
              {mutation.isPending ? 'Adding…' : 'Add Investor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
