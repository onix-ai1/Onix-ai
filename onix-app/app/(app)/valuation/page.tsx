'use client';

import { useState, useCallback } from 'react';

/* ── helpers ── */
const parseMoney = (s: string) => {
  if (!s) return 0;
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (!n) return 0;
  if (/B/i.test(s)) return n * 1_000_000_000;
  if (/M/i.test(s)) return n * 1_000_000;
  if (/K/i.test(s)) return n * 1_000;
  if (/CR/i.test(s)) return n * 10_000_000;
  return n;
};
const money = (n: number) => {
  if (!n || n <= 0) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const SECTORS = ['Technology','Healthcare','Manufacturing','Retail','Financial Services','Real Estate','Energy','Education','Media','Consumer Goods','Logistics','Other'];
const STAGES  = ['Pre-Revenue','Early Stage','Growth','Mature','Declining'];
const DEAL_TYPES = ['Full Sale','Majority Stake','Minority Stake / PE Investment','Management Buyout','Capital Raise'];

const EBITDA_MULTIPLES: Record<string, number> = {
  Technology: 14, Healthcare: 12, 'Financial Services': 11, Energy: 8,
  Manufacturing: 7, Retail: 6, 'Real Estate': 10, Education: 9,
  Media: 8, 'Consumer Goods': 7, Logistics: 7, Other: 7,
};
const REV_MULTIPLES: Record<string, number> = {
  Technology: 4, Healthcare: 2.5, 'Financial Services': 3, Energy: 1.5,
  Manufacturing: 1, Retail: 0.8, 'Real Estate': 2, Education: 2,
  Media: 1.5, 'Consumer Goods': 1.2, Logistics: 1, Other: 1.2,
};

const VERDICT_COLOR: Record<string, string> = {
  'Undervalued': '#22c55e', 'Fair Value': '#C9A84C',
  'Slightly Overpriced': '#f97316', 'Overpriced': '#ef4444',
  'Highly Attractive': '#22c55e', 'Attractive': '#86efac',
  'Moderate': '#C9A84C', 'Difficult to Place': '#f97316', 'Hard Pass': '#ef4444',
};

interface Inputs {
  companyName: string; sector: string; location: string;
  stage: string; dealType: string; description: string; saleReason: string;
  revenue: string; ebitda: string; netProfit: string;
  revenueGrowth: number; yearsOp: number;
  askingPrice: string; discountRate: number; growthRate: number;
}

interface AIResult {
  valuationScore: number; valuationVerdict: string; valuationSummary: string;
  bestMethod: string; fairValueRange: string;
  matchScore: number; matchVerdict: string; matchSummary: string;
  idealBuyerProfiles: { type: string; why: string; fit: number }[];
  strengths: string[]; weaknesses: string[]; valueDrivers: string[];
  redFlags: string[]; preExitSteps: string[];
}

const DEFAULT: Inputs = {
  companyName: '', sector: '', location: '', stage: 'Growth',
  dealType: 'Full Sale', description: '', saleReason: '',
  revenue: '', ebitda: '', netProfit: '',
  revenueGrowth: 15, yearsOp: 5, askingPrice: '',
  discountRate: 12, growthRate: 10,
};

export default function ValuationPage() {
  const [inputs, setInputs]     = useState<Inputs>(DEFAULT);
  const [result, setResult]     = useState<AIResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const set = (k: keyof Inputs, v: string | number) =>
    setInputs(p => ({ ...p, [k]: v }));

  /* ── compute valuations ── */
  const rev   = parseMoney(inputs.revenue);
  const ebt   = parseMoney(inputs.ebitda);
  const np    = parseMoney(inputs.netProfit);

  const ebitdaMult  = EBITDA_MULTIPLES[inputs.sector] || 7;
  const revMult     = REV_MULTIPLES[inputs.sector]    || 1.2;
  const growthAdj   = 1 + (inputs.revenueGrowth - 10) * 0.02;

  const ebitdaVal   = ebt * ebitdaMult * growthAdj;
  const revenueVal  = rev * revMult * growthAdj;

  // Simplified DCF: 5yr FCF (proxy: EBITDA) discounted
  let dcfVal = 0;
  for (let y = 1; y <= 5; y++) {
    dcfVal += (ebt * Math.pow(1 + inputs.growthRate / 100, y)) /
              Math.pow(1 + inputs.discountRate / 100, y);
  }
  const terminalVal = (ebt * Math.pow(1 + inputs.growthRate / 100, 5) *
    (1 + 0.03)) / ((inputs.discountRate / 100) - 0.03);
  dcfVal += terminalVal / Math.pow(1 + inputs.discountRate / 100, 5);

  const weightedVal  = (ebitdaVal * 0.4 + revenueVal * 0.3 + dcfVal * 0.3);
  const rangeLow     = weightedVal * 0.85;
  const rangeHigh    = weightedVal * 1.2;

  const valuations = {
    ebitdaVal:   money(ebitdaVal),
    revenueVal:  money(revenueVal),
    dcfVal:      money(dcfVal),
    weightedVal: money(weightedVal),
    rangeLow:    money(rangeLow),
    rangeHigh:   money(rangeHigh),
  };

  const runAI = useCallback(async () => {
    if (!inputs.revenue || !inputs.ebitda || !inputs.sector) {
      setError('Please fill in Revenue, EBITDA, and Sector first.');
      return;
    }
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs, valuations }),
      });
      if (!res.ok) throw new Error();
      setResult(JSON.parse(await res.text()));
    } catch {
      setError('AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [inputs, valuations]);

  /* ── ui helpers ── */
  const textInput = (label: string, key: keyof Inputs, placeholder = '', type = 'text') => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>{label}</label>
      <input type={type} value={inputs[key] as string}
        onChange={e => set(key, e.target.value)} placeholder={placeholder}
        className="rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }} />
    </div>
  );

  const numInput = (label: string, key: keyof Inputs, unit = '', min = 0, max = 100) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>{label}</label>
      <div className="relative">
        <input type="number" min={min} max={max} value={inputs[key] as number}
          onChange={e => set(key, parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg px-3 py-2 pr-8 text-sm outline-none"
          style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }} />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--onix-muted)' }}>{unit}</span>}
      </div>
    </div>
  );

  const selectInput = (label: string, key: keyof Inputs, opts: string[]) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>{label}</label>
      <select value={inputs[key] as string} onChange={e => set(key, e.target.value)}
        className="rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const metCard = (label: string, value: string, sub = '', gold = false) => (
    <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: 'var(--onix-card)', border: `1px solid ${gold ? 'var(--onix-gold)' : 'var(--onix-border)'}` }}>
      <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>{label}</p>
      <p className="text-base font-bold" style={{ color: gold ? 'var(--onix-gold)' : 'var(--onix-text)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>{sub}</p>}
    </div>
  );

  const scoreRing = (score: number, label: string, color: string) => (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 96 96" className="w-24 h-24 -rotate-90">
          <circle cx="48" cy="48" r="38" fill="none" stroke="var(--onix-card)" strokeWidth="9"/>
          <circle cx="48" cy="48" r="38" fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${(score / 100) * 239} 239`} strokeLinecap="round"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-xs" style={{ color: 'var(--onix-muted)' }}>/100</span>
        </div>
      </div>
      <p className="text-xs font-medium text-center" style={{ color: 'var(--onix-muted)' }}>{label}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--onix-text)' }}>Business Valuation & Matchmaking</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--onix-muted)' }}>
          Get a multi-method valuation and AI-powered buyer/investor match report
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: Inputs ── */}
        <div className="flex flex-col gap-5">

          {/* Business Profile */}
          <section className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>🏢 Business Profile</h3>
            <div className="grid grid-cols-2 gap-3">
              {textInput('Company Name', 'companyName', 'Acme Pvt Ltd')}
              {textInput('Location', 'location', 'Mumbai, India')}
              {selectInput('Sector', 'sector', SECTORS)}
              {selectInput('Business Stage', 'stage', STAGES)}
              {selectInput('Deal Type', 'dealType', DEAL_TYPES)}
              {numInput('Years in Operation', 'yearsOp', 'yrs', 0, 100)}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Business Description</label>
              <textarea rows={2} value={inputs.description}
                onChange={e => set('description', e.target.value)}
                placeholder="What does the business do? Key products, customers, moat…"
                className="rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Reason for Sale / Capital Raise</label>
              <textarea rows={2} value={inputs.saleReason}
                onChange={e => set('saleReason', e.target.value)}
                placeholder="Retirement, growth capital, founder exit, strategic acquisition…"
                className="rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}/>
            </div>
          </section>

          {/* Financials */}
          <section className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>📊 Financials</h3>
            <div className="grid grid-cols-2 gap-3">
              {textInput('Annual Revenue *', 'revenue', '$5M or ₹25Cr')}
              {textInput('EBITDA *', 'ebitda', '$1M or ₹5Cr')}
              {textInput('Net Profit', 'netProfit', '$800K')}
              {textInput('Asking Price (optional)', 'askingPrice', '$8M or ₹40Cr')}
              {numInput('Revenue Growth YoY', 'revenueGrowth', '%', -50, 200)}
              {numInput('Discount Rate (DCF)', 'discountRate', '%', 5, 40)}
            </div>
          </section>
        </div>

        {/* ── RIGHT: Computed Valuations ── */}
        <div className="flex flex-col gap-5">

          <section className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>Computed Valuations</h3>
              {inputs.sector && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--onix-gold)' }}>{inputs.sector} multiples applied</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {metCard('EBITDA Multiple Method', valuations.ebitdaVal, `${ebitdaMult}x sector avg × growth adj`)}
              {metCard('Revenue Multiple Method', valuations.revenueVal, `${revMult}x sector avg`)}
              {metCard('DCF Method (5yr)', valuations.dcfVal, `${inputs.discountRate}% discount rate`)}
              {metCard('Weighted Average', valuations.weightedVal, '40% EBITDA · 30% Rev · 30% DCF', true)}
            </div>
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--onix-muted)' }}>Estimated Valuation Range</p>
                <p className="text-xl font-bold" style={{ color: 'var(--onix-gold)' }}>
                  {valuations.rangeLow} – {valuations.rangeHigh}
                </p>
              </div>
              {inputs.askingPrice && (
                <div className="text-right">
                  <p className="text-xs mb-1" style={{ color: 'var(--onix-muted)' }}>Owner Asking</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--onix-text)' }}>{inputs.askingPrice}</p>
                </div>
              )}
            </div>
          </section>

          {/* Sector benchmarks */}
          {inputs.sector && (
            <section className="rounded-xl p-5 flex flex-col gap-3" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>Sector Benchmarks — {inputs.sector}</h3>
              <div className="grid grid-cols-2 gap-3">
                {metCard('Typical EV/EBITDA', `${ebitdaMult}x`)}
                {metCard('Typical EV/Revenue', `${revMult}x`)}
              </div>
            </section>
          )}

          {/* AI Button */}
          <button
            onClick={runAI} disabled={loading}
            className="w-full rounded-xl py-4 font-semibold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#C9A84C,#E8C96A)', color: '#0D0D0D' }}
          >
            {loading ? <><SpinIcon /> Generating AI Report…</> : <><SparkIcon /> Get Valuation & Match Report</>}
          </button>
          {error && <p className="text-xs text-center" style={{ color: '#ef4444' }}>{error}</p>}
        </div>
      </div>

      {/* ── AI Result ── */}
      {result && (
        <div className="flex flex-col gap-6 rounded-2xl p-6" style={{ background: 'var(--onix-surface)', border: '2px solid var(--onix-gold)' }}>

          {/* Score header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex gap-8">
              {scoreRing(result.valuationScore, 'Valuation Score', VERDICT_COLOR[result.valuationVerdict] || '#C9A84C')}
              {scoreRing(result.matchScore, 'Market Attractiveness', VERDICT_COLOR[result.matchVerdict] || '#C9A84C')}
            </div>
            <div className="flex flex-col gap-3 flex-1 max-w-md">
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${VERDICT_COLOR[result.valuationVerdict] || '#888'}20`, color: VERDICT_COLOR[result.valuationVerdict] || '#888' }}>
                  {result.valuationVerdict}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${VERDICT_COLOR[result.matchVerdict] || '#888'}20`, color: VERDICT_COLOR[result.matchVerdict] || '#888' }}>
                  {result.matchVerdict}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--onix-gold)' }}>AI Fair Value Range</p>
                <p className="text-lg font-bold" style={{ color: 'var(--onix-text)' }}>{result.fairValueRange}</p>
              </div>
            </div>
          </div>

          {/* Valuation + Match summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--onix-card)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--onix-gold)' }}>💰 Valuation Analysis</p>
              <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--onix-muted)' }}>{result.valuationSummary}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--onix-muted)' }}><span style={{ color: 'var(--onix-text)' }}>Best method:</span> {result.bestMethod}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--onix-card)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--onix-gold)' }}>🎯 Market Matchmaking</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--onix-muted)' }}>{result.matchSummary}</p>
            </div>
          </div>

          {/* Ideal Buyer Profiles */}
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--onix-text)' }}>Ideal Buyer / Investor Profiles</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {result.idealBuyerProfiles.map((b, i) => (
                <div key={i} className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>{b.type}</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--onix-gold)' }}>{b.fit}%</span>
                  </div>
                  {/* fit bar */}
                  <div className="rounded-full h-1.5 w-full" style={{ background: 'var(--onix-border)' }}>
                    <div className="rounded-full h-1.5 transition-all" style={{ width: `${b.fit}%`, background: 'var(--onix-gold)' }}/>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--onix-muted)' }}>{b.why}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths / Weaknesses / Value Drivers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: '#22c55e' }}>✓ Strengths</p>
              {result.strengths.map((s, i) => <p key={i} className="text-xs leading-relaxed mb-1.5 flex gap-2" style={{ color: 'var(--onix-muted)' }}><span style={{ color: '#22c55e' }}>•</span>{s}</p>)}
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: '#ef4444' }}>⚠ Weaknesses</p>
              {result.weaknesses.map((w, i) => <p key={i} className="text-xs leading-relaxed mb-1.5 flex gap-2" style={{ color: 'var(--onix-muted)' }}><span style={{ color: '#ef4444' }}>•</span>{w}</p>)}
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--onix-gold)' }}>↑ Value Drivers</p>
              {result.valueDrivers.map((v, i) => <p key={i} className="text-xs leading-relaxed mb-1.5 flex gap-2" style={{ color: 'var(--onix-muted)' }}><span style={{ color: 'var(--onix-gold)' }}>•</span>{v}</p>)}
            </div>
          </div>

          {/* Red Flags + Pre-Exit Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--onix-card)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: '#f97316' }}>🚩 Red Flags to Address</p>
              {result.redFlags.map((r, i) => <p key={i} className="text-xs leading-relaxed mb-1.5 flex gap-2" style={{ color: 'var(--onix-muted)' }}><span style={{ color: '#f97316' }}>•</span>{r}</p>)}
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--onix-card)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: '#60a5fa' }}>📋 Pre-Market Steps</p>
              {result.preExitSteps.map((s, i) => <p key={i} className="text-xs leading-relaxed mb-1.5 flex gap-2" style={{ color: 'var(--onix-muted)' }}><span className="font-bold" style={{ color: '#60a5fa', flexShrink: 0 }}>{i + 1}.</span>{s}</p>)}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function SparkIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}
function SpinIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}
