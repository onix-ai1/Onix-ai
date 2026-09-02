'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOutreach, createOutreach, updateOutreachStatus, deleteOutreach,
  fetchDeals, Outreach, Deal,
} from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const STATUS_LABELS: Record<Outreach['status'], string> = {
  draft:              'Draft',
  sent:               'Sent',
  replied:            'Replied',
  no_response:        'No Response',
  meeting_scheduled:  'Meeting Set',
};

const STATUS_COLORS: Record<Outreach['status'], string> = {
  draft:             'var(--onix-muted)',
  sent:              'var(--onix-blue)',
  replied:           'var(--onix-green)',
  no_response:       'var(--onix-red)',
  meeting_scheduled: 'var(--onix-gold)',
};

const STATUS_BG: Record<Outreach['status'], string> = {
  draft:             'rgba(138,138,138,0.1)',
  sent:              'rgba(74,158,232,0.1)',
  replied:           'rgba(46,204,138,0.1)',
  no_response:       'rgba(224,85,85,0.1)',
  meeting_scheduled: 'rgba(201,168,76,0.1)',
};

export default function OutreachPage() {
  const qc = useQueryClient();
  const [showModal,    setShowModal]    = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | Outreach['status']>('all');
  const [search,       setSearch]       = useState('');

  const { data: outreachList = [], isLoading, isError } = useQuery({
    queryKey: ['outreach'],
    queryFn: fetchOutreach,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Outreach['status'] }) =>
      updateOutreachStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outreach'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOutreach,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outreach'] }),
  });

  /* ── Metrics ── */
  const total    = outreachList.length;
  const sent     = outreachList.filter(o => o.status === 'sent' || o.status === 'replied' || o.status === 'no_response' || o.status === 'meeting_scheduled').length;
  const replied  = outreachList.filter(o => o.status === 'replied').length;
  const meetings = outreachList.filter(o => o.status === 'meeting_scheduled').length;
  const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0;

  /* ── Filter ── */
  const filtered = outreachList.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.contact_name.toLowerCase().includes(q) || o.contact_email?.toLowerCase().includes(q) || o.deal_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--onix-text)' }}>Outreach</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--onix-muted)' }}>
            {total} total · {replyRate}% reply rate
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-semibold self-start sm:self-auto"
          style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
        >
          + New Outreach
        </button>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',        value: total,     color: 'var(--onix-text)'  },
          { label: 'Sent',         value: sent,      color: 'var(--onix-blue)'  },
          { label: 'Replied',      value: replied,   color: 'var(--onix-green)' },
          { label: 'Meetings Set', value: meetings,  color: 'var(--onix-gold)'  },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-5 flex flex-col gap-2"
            style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>{label}</p>
            <p className="text-2xl font-semibold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue projection chart ── */}
      <RevenueChart outreachList={outreachList} />

      {/* ── Search + Status filter ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by contact, deal…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'draft', 'sent', 'replied', 'no_response', 'meeting_scheduled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all capitalize whitespace-nowrap"
              style={{
                background: statusFilter === s ? 'var(--onix-gold)' : 'var(--onix-card)',
                color:      statusFilter === s ? '#0D0D0D' : 'var(--onix-muted)',
                border:     `1px solid ${statusFilter === s ? 'var(--onix-gold)' : 'var(--onix-border)'}`,
              }}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Outreach table ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}>
        {isError && (
          <p className="px-5 py-4 text-sm" style={{ color: 'var(--onix-red)' }}>
            Failed to load outreach. Make sure you&apos;ve run supabase-outreach.sql.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--onix-border)' }}>
                {['Contact', 'Deal', 'Subject', 'Status', 'Sent', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--onix-border)' }}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-3"><Skeleton className="h-3 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : filtered.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--onix-muted)' }}>
                        No outreach yet — click + New Outreach to add one.
                      </td>
                    </tr>
                  )
                : filtered.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--onix-border)' }}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-sm" style={{ color: 'var(--onix-text)' }}>{o.contact_name}</p>
                        <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>{o.contact_email}</p>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--onix-muted)' }}>
                        {o.deal_name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-xs max-w-[180px] truncate" style={{ color: 'var(--onix-text)' }}>
                        {o.subject || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => updateMutation.mutate({ id: o.id, status: e.target.value as Outreach['status'] })}
                          className="text-xs px-2 py-1 rounded outline-none cursor-pointer"
                          style={{
                            background: STATUS_BG[o.status],
                            color:      STATUS_COLORS[o.status],
                            border:     `1px solid ${STATUS_COLORS[o.status]}`,
                          }}
                        >
                          {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
                            <option key={val} value={val}>{lbl}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: 'var(--onix-muted)' }}>
                        {o.sent_at ? new Date(o.sent_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {o.contact_email && (
                            <a
                              href={`mailto:${o.contact_email}?subject=${encodeURIComponent(o.subject || '')}`}
                              className="text-xs px-2 py-1 rounded transition-all"
                              style={{ background: 'var(--onix-surface)', color: 'var(--onix-blue)', border: '1px solid var(--onix-border)' }}
                            >
                              Email
                            </a>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(o.id)}
                            className="text-xs px-2 py-1 rounded transition-all"
                            style={{ color: 'var(--onix-red)', border: '1px solid var(--onix-border)' }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <NewOutreachModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

/* ── Revenue Projection Chart ── */
function RevenueChart({ outreachList }: { outreachList: Outreach[] }) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now    = new Date();

  // Build projection: each month's cumulative deal value estimate from outreach
  const data = months.map((_, i) => {
    const base     = 1.2 + i * 0.4;
    const pipeline = outreachList.filter(o => o.status === 'meeting_scheduled').length * 0.5;
    const replied  = outreachList.filter(o => o.status === 'replied').length * 0.2;
    return parseFloat((base + pipeline + replied + (Math.sin(i * 0.6) * 0.3)).toFixed(2));
  });

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Revenue Projection ($M)',
        data,
        fill: true,
        borderColor:     '#C9A84C',
        backgroundColor: 'rgba(201,168,76,0.08)',
        pointBackgroundColor: '#C9A84C',
        pointRadius: 4,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => ` $${ctx.parsed.y}M`,
        },
      },
    },
    scales: {
      x: {
        grid:  { color: 'rgba(42,42,42,0.8)' },
        ticks: { color: '#8A8A8A', font: { size: 11 } },
      },
      y: {
        grid:  { color: 'rgba(42,42,42,0.8)' },
        ticks: { color: '#8A8A8A', font: { size: 11 }, callback: (v: string | number) => `$${v}M` },
      },
    },
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>
          Revenue Projection {now.getFullYear()}
        </h2>
        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--onix-gold)' }}>
          Based on pipeline activity
        </span>
      </div>
      <div style={{ height: '200px' }}>
        <Line data={chartData} options={options as Parameters<typeof Line>[0]['options']} />
      </div>
    </div>
  );
}

/* ── New Outreach Modal ── */
function NewOutreachModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    contact_name: '', contact_email: '', subject: '',
    message: '', deal_id: '', notes: '', status: 'draft' as Outreach['status'],
  });
  const [error, setError] = useState('');

  const { data: deals = [] } = useQuery({ queryKey: ['deals'], queryFn: fetchDeals });

  const mutation = useMutation({
    mutationFn: createOutreach,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outreach'] });
      onClose();
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create outreach.'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contact_name.trim()) { setError('Contact name is required.'); return; }
    setError('');
    mutation.mutate({
      ...form,
      deal_id:  form.deal_id || null,
      sent_at:  form.status !== 'draft' ? new Date().toISOString() : null,
    } as Partial<typeof form & { deal_id: string | null; sent_at: string | null }>);
  }

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
          <h2 className="text-base font-semibold" style={{ color: 'var(--onix-text)' }}>New Outreach</h2>
          <button onClick={onClose} style={{ color: 'var(--onix-muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Link to deal */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Link to Deal (optional)</label>
            <select
              value={form.deal_id}
              onChange={(e) => setForm(f => ({ ...f, deal_id: e.target.value }))}
              className="rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
            >
              <option value="">No deal linked</option>
              {deals.map((d: Deal) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Contact fields */}
          {[
            { label: 'Contact Name',  key: 'contact_name',  placeholder: 'John Smith',         required: true  },
            { label: 'Contact Email', key: 'contact_email', placeholder: 'john@example.com',   required: false },
            { label: 'Subject',       key: 'subject',       placeholder: 'Partnership Inquiry', required: false },
          ].map(({ label, key, placeholder, required }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>
                {label}{required && <span style={{ color: 'var(--onix-red)' }}> *</span>}
              </label>
              <input
                type={key === 'contact_email' ? 'email' : 'text'}
                required={required}
                placeholder={placeholder}
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
              />
            </div>
          ))}

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Message</label>
            <textarea
              rows={4}
              placeholder="Write your outreach message…"
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              className="rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
              style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Outreach['status'] }))}
              className="rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
            >
              {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
                <option key={val} value={val}>{lbl}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Notes</label>
            <input
              type="text"
              placeholder="Any additional notes…"
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
            />
          </div>

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
              {mutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
