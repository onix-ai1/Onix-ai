'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchInvestors, fetchBusinessListings } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const VERDICT_COLOR: Record<string, string> = {
  'Strong Match': '#22c55e', 'Good Match': '#C9A84C',
  'Possible Match': '#f97316', 'Weak Match': '#ef4444',
};

interface Match {
  id: string; name: string; fitScore: number; verdict: string;
  reason: string; concerns: string; suggestedApproach: string;
}

export default function MatchingPage() {
  const [mode, setMode] = useState<'business_to_investors' | 'investor_to_businesses'>('business_to_investors');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState('');

  // Business → Investors: user picks/enters a business
  const [bizName, setBizName]     = useState('');
  const [bizSector, setBizSector] = useState('');
  const [bizRevenue, setBizRevenue] = useState('');
  const [bizEbitda, setBizEbitda] = useState('');
  const [bizDeal, setBizDeal]     = useState('Full Sale');
  const [bizLocation, setBizLocation] = useState('');
  const [bizDesc, setBizDesc]     = useState('');

  // Investor → Businesses: user picks/enters investor criteria
  const [invName, setInvName]       = useState('');
  const [invType, setInvType]       = useState('');
  const [invSectors, setInvSectors] = useState('');
  const [invMin, setInvMin]         = useState('');
  const [invMax, setInvMax]         = useState('');
  const [invGeo, setInvGeo]         = useState('');
  const [invStage, setInvStage]     = useState('');

  const { data: investors = [] }  = useQuery({ queryKey: ['investors'],         queryFn: fetchInvestors });
  const { data: listings  = [] }  = useQuery({ queryKey: ['business_listings'], queryFn: fetchBusinessListings });

  async function runMatch() {
    setError(''); setLoading(true); setMatches([]);
    try {
      let query: object, pool: object[];
      if (mode === 'business_to_investors') {
        if (!bizSector) { setError('Enter at least Sector.'); setLoading(false); return; }
        query = { name: bizName, sector: bizSector, revenue: bizRevenue, ebitda: bizEbitda, dealType: bizDeal, location: bizLocation, description: bizDesc };
        pool  = investors.map(i => ({ id: i.id, name: i.name || i.firm, type: i.focus_sector, ticketSize: i.ticket_size, stage: i.stage_preference, geography: i.location, notes: i.notes }));
        if (!pool.length) { setError('No investors in database. Add investors first.'); setLoading(false); return; }
      } else {
        if (!invSectors) { setError('Enter at least Target Sectors.'); setLoading(false); return; }
        query = { name: invName, type: invType, targetSectors: invSectors, dealSizeMin: invMin, dealSizeMax: invMax, geography: invGeo, preferredStage: invStage };
        pool  = listings.map(l => ({ id: l.id, name: l.company_name, sector: l.sector, location: l.location, askingPrice: l.asking_price, revenue: l.revenue, ebitda: l.ebitda, description: l.description }));
        if (!pool.length) { setError('No business listings in database. Add listings first.'); setLoading(false); return; }
      }
      const res = await fetch('/api/matching', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, query, pool }) });
      const data = await res.json();
      setMatches(data.matches || []);
    } catch { setError('Matching failed. Please try again.'); }
    finally { setLoading(false); }
  }

  async function expressInterest(match: Match) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('outreach').insert({
      user_id: user?.id,
      contact_name: match.name,
      contact_email: '',
      subject: `Match Inquiry — ${match.name}`,
      message: match.suggestedApproach,
      status: 'draft',
      notes: `AI Match Score: ${match.fitScore}/100. ${match.reason}`,
    });
    alert(`Outreach record created for ${match.name}`);
  }

  const inp = (label: string, val: string, set: (v: string) => void, placeholder = '') => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>{label}</label>
      <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
        className="rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}/>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--onix-text)' }}>M&A Matching Engine</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--onix-muted)' }}>AI-powered bidirectional deal matching</p>
      </div>

      {/* Mode tabs */}
      <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
        {([
          { key: 'business_to_investors', label: '🏢 Business → Find Investors' },
          { key: 'investor_to_businesses', label: '💼 Investor → Find Businesses' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => { setMode(t.key); setMatches([]); }}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ background: mode === t.key ? 'var(--onix-gold)' : 'transparent', color: mode === t.key ? '#0D0D0D' : 'var(--onix-muted)' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>
            {mode === 'business_to_investors' ? 'Business Profile' : 'Investor Criteria'}
          </h3>

          {mode === 'business_to_investors' ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {inp('Company Name', bizName, setBizName, 'Acme Pvt Ltd')}
                {inp('Sector *', bizSector, setBizSector, 'Technology')}
                {inp('Annual Revenue', bizRevenue, setBizRevenue, '$5M')}
                {inp('EBITDA', bizEbitda, setBizEbitda, '$1M')}
                {inp('Location', bizLocation, setBizLocation, 'Mumbai')}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Deal Type</label>
                <select value={bizDeal} onChange={e => setBizDeal(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}>
                  {['Full Sale','Majority Stake','Minority Stake','Capital Raise','MBO'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              {inp('Business Description', bizDesc, setBizDesc, 'What does the business do?')}
              <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>
                Will match against <strong style={{ color: 'var(--onix-text)' }}>{investors.length}</strong> investor{investors.length !== 1 ? 's' : ''} in your database
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {inp('Investor / Fund Name', invName, setInvName, 'ABC Capital')}
                {inp('Investor Type', invType, setInvType, 'PE / VC / Family Office')}
                {inp('Target Sectors *', invSectors, setInvSectors, 'Technology, SaaS')}
                {inp('Min Deal Size', invMin, setInvMin, '$2M')}
                {inp('Max Deal Size', invMax, setInvMax, '$20M')}
                {inp('Geography', invGeo, setInvGeo, 'India, SEA')}
                {inp('Preferred Stage', invStage, setInvStage, 'Growth, Mature')}
              </div>
              <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>
                Will match against <strong style={{ color: 'var(--onix-text)' }}>{listings.length}</strong> business listing{listings.length !== 1 ? 's' : ''} in your database
              </p>
            </div>
          )}

          <button onClick={runMatch} disabled={loading}
            className="w-full rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#C9A84C,#E8C96A)', color: '#0D0D0D' }}>
            {loading ? <><SpinIcon /> Running AI Match…</> : <><SparkIcon /> Find Matches</>}
          </button>
          {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
        </div>

        {/* Results */}
        <div className="flex flex-col gap-3">
          {!matches.length && !loading && (
            <div className="flex flex-col items-center justify-center h-full rounded-xl gap-3 py-16"
              style={{ background: 'var(--onix-surface)', border: '1px dashed var(--onix-border)' }}>
              <span style={{ fontSize: 40 }}>🎯</span>
              <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>Fill in the profile and click Find Matches</p>
            </div>
          )}

          {matches.map((m, i) => {
            const color = VERDICT_COLOR[m.verdict] || '#888';
            return (
              <div key={m.id} className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: 'var(--onix-surface)', border: `1px solid ${i === 0 ? 'var(--onix-gold)' : 'var(--onix-border)'}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--onix-gold)' }}>Best Match</span>}
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--onix-text)' }}>{m.name}</h4>
                    </div>
                    <span className="text-xs font-medium mt-0.5 inline-block" style={{ color }}>{m.verdict}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="relative w-12 h-12">
                      <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
                        <circle cx="24" cy="24" r="18" fill="none" stroke="var(--onix-card)" strokeWidth="5"/>
                        <circle cx="24" cy="24" r="18" fill="none" stroke={color} strokeWidth="5"
                          strokeDasharray={`${(m.fitScore / 100) * 113} 113`} strokeLinecap="round"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold" style={{ color }}>{m.fitScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--onix-muted)' }}>{m.reason}</p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-2" style={{ background: 'rgba(239,68,68,0.06)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#ef4444' }}>⚠ Concern</p>
                    <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>{m.concerns}</p>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: 'rgba(201,168,76,0.06)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--onix-gold)' }}>→ Approach</p>
                    <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>{m.suggestedApproach}</p>
                  </div>
                </div>

                <button onClick={() => expressInterest(m)}
                  className="w-full rounded-lg py-2 text-xs font-semibold transition-all"
                  style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--onix-gold)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  + Log Outreach / Express Interest
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SparkIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>;
}
function SpinIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="animate-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
}
