'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBusinessListings,
  createBusinessListing,
  updateBusinessListingStatus,
  deleteBusinessListing,
  BusinessListing,
} from '@/lib/api';

const SECTORS = ['Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Financial Services', 'Real Estate', 'Energy', 'Education', 'Media', 'Other'];
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:      { label: 'Active',       color: '#22c55e' },
  under_offer: { label: 'Under Offer',  color: '#C9A84C' },
  sold:        { label: 'Sold',         color: '#888' },
};

const EMPTY: Partial<BusinessListing> = {
  company_name: '', sector: '', location: '', asking_price: '',
  revenue: '', ebitda: '', description: '', contact_email: '', contact_phone: '',
};

export default function ListingsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState<Partial<BusinessListing>>(EMPTY);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilter]   = useState('all');
  const [myOnly, setMyOnly]         = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['business_listings'],
    queryFn: fetchBusinessListings,
  });

  const createMut = useMutation({
    mutationFn: createBusinessListing,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['business_listings'] }); setShowModal(false); setForm(EMPTY); },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BusinessListing['status'] }) =>
      updateBusinessListingStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business_listings'] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteBusinessListing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['business_listings'] }),
  });

  const filtered = listings.filter(l => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (search && !l.company_name.toLowerCase().includes(search.toLowerCase()) &&
        !l.sector.toLowerCase().includes(search.toLowerCase()) &&
        !l.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function field(key: keyof typeof form, label: string, opts?: { type?: string; placeholder?: string; textarea?: boolean; select?: string[] }) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>{label}</label>
        {opts?.select ? (
          <select
            value={form[key] as string || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
          >
            <option value="">Select…</option>
            {opts.select.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : opts?.textarea ? (
          <textarea
            rows={3}
            value={form[key] as string || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={opts?.placeholder}
            className="rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
          />
        ) : (
          <input
            type={opts?.type || 'text'}
            value={form[key] as string || ''}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={opts?.placeholder}
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--onix-text)' }}>Business Listings</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--onix-muted)' }}>
            Companies available for acquisition
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
        >
          <span className="text-lg leading-none">+</span> List a Business
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, sector, location…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-lg px-4 py-2 text-sm outline-none"
          style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
        />
        <select
          value={filterStatus}
          onChange={e => setFilter(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="under_offer">Under Offer</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="text-center py-16" style={{ color: 'var(--onix-muted)' }}>Loading listings…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div style={{ color: 'var(--onix-muted)', fontSize: 48 }}>🏢</div>
          <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>No listings yet. Be the first to list a business.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
          >
            List a Business
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(l => {
            const st = STATUS_LABELS[l.status];
            const expanded = expandedId === l.id;
            return (
              <div
                key={l.id}
                className="rounded-xl flex flex-col gap-3 p-5 transition-all"
                style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-base" style={{ color: 'var(--onix-text)' }}>{l.company_name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--onix-muted)' }}>{l.sector}{l.location ? ` · ${l.location}` : ''}</p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${st.color}20`, color: st.color }}
                  >
                    {st.label}
                  </span>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Asking Price', value: l.asking_price || '—' },
                    { label: 'Revenue',      value: l.revenue      || '—' },
                    { label: 'EBITDA',       value: l.ebitda       || '—' },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg p-2 text-center" style={{ background: 'var(--onix-card)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--onix-muted)' }}>{m.label}</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--onix-gold)' }}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {l.description && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--onix-muted)' }}>
                    {expanded ? l.description : l.description.slice(0, 100) + (l.description.length > 100 ? '…' : '')}
                    {l.description.length > 100 && (
                      <button
                        onClick={() => setExpandedId(expanded ? null : l.id)}
                        className="ml-1 underline"
                        style={{ color: 'var(--onix-gold)' }}
                      >
                        {expanded ? 'less' : 'more'}
                      </button>
                    )}
                  </p>
                )}

                {/* Contact */}
                <div className="flex flex-col gap-1">
                  {l.contact_email && (
                    <a href={`mailto:${l.contact_email}`} className="text-xs flex items-center gap-1.5 hover:underline" style={{ color: 'var(--onix-muted)' }}>
                      <MailIcon size={12} /> {l.contact_email}
                    </a>
                  )}
                  {l.contact_phone && (
                    <a href={`tel:${l.contact_phone}`} className="text-xs flex items-center gap-1.5 hover:underline" style={{ color: 'var(--onix-muted)' }}>
                      <PhoneIcon size={12} /> {l.contact_phone}
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--onix-border)' }}>
                  <select
                    value={l.status}
                    onChange={e => statusMut.mutate({ id: l.id, status: e.target.value as BusinessListing['status'] })}
                    className="flex-1 rounded-lg px-2 py-1.5 text-xs outline-none"
                    style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
                  >
                    <option value="active">Active</option>
                    <option value="under_offer">Under Offer</option>
                    <option value="sold">Sold</option>
                  </select>
                  <button
                    onClick={() => { if (confirm(`Delete listing "${l.company_name}"?`)) deleteMut.mutate(l.id); }}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
                    title="Delete"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5 overflow-y-auto"
            style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)', maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--onix-text)' }}>List a Business for Sale</h3>
              <button onClick={() => { setShowModal(false); setForm(EMPTY); }} style={{ color: 'var(--onix-muted)' }}>✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('company_name', 'Company Name *', { placeholder: 'Acme Corp' })}
              {field('sector', 'Sector', { select: SECTORS })}
              {field('location', 'Location', { placeholder: 'Mumbai, India' })}
              {field('asking_price', 'Asking Price', { placeholder: '₹50Cr / $5M' })}
              {field('revenue', 'Annual Revenue', { placeholder: '₹20Cr' })}
              {field('ebitda', 'EBITDA', { placeholder: '₹5Cr' })}
              {field('contact_email', 'Contact Email', { type: 'email', placeholder: 'advisor@firm.com' })}
              {field('contact_phone', 'Contact Phone', { placeholder: '+91 98765 43210' })}
            </div>
            {field('description', 'Business Description', { textarea: true, placeholder: 'Describe the business, growth story, reason for sale…' })}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY); }}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ color: 'var(--onix-muted)', background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}
              >
                Cancel
              </button>
              <button
                disabled={!form.company_name || createMut.isPending}
                onClick={() => createMut.mutate(form)}
                className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
                style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
              >
                {createMut.isPending ? 'Listing…' : 'List Business'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MailIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}
function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
    </svg>
  );
}
