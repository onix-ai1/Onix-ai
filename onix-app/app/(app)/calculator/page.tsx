'use client';

import { useState, useCallback } from 'react';

/* ── helpers ── */
const fmt = (n: number, decimals = 1) =>
  isNaN(n) || !isFinite(n) ? '—' : n.toFixed(decimals);

const parseMoney = (s: string) => {
  if (!s) return 0;
  const m = s.replace(/[^0-9.KkMmBbCcRr]/g, '');
  const n = parseFloat(m);
  if (s.toUpperCase().includes('B')) return n * 1_000_000_000;
  if (s.toUpperCase().includes('M')) return n * 1_000_000;
  if (s.toUpperCase().includes('K')) return n * 1_000;
  if (s.toUpperCase().includes('CR')) return n * 10_000_000;
  return n;
};

const money = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const VERDICT_COLOR: Record<string, string> = {
  'Strong Buy': '#22c55e',
  'Buy':        '#86efac',
  'Neutral':    '#C9A84C',
  'Caution':    '#f97316',
  'Pass':       '#ef4444',
};

/* ── types ── */
interface Inputs {
  revenue: string; ebitda: string; askingPrice: string;
  cashPct: number; equityPct: number; earnoutPct: number;
  debtPct: number; interestRate: number;
  revenueCagr: number; exitMultiple: number;
}

interface AIResult {
  dealScore: number; verdict: string; summary: string;
  strengths: string[]; risks: string[]; recommendations: string[];
  valuationComment: string; structureComment: string; financingComment: string;
}

const DEFAULT: Inputs = {
  revenue: '', ebitda: '', askingPrice: '',
  cashPct: 70, equityPct: 20, earnoutPct: 10,
  debtPct: 50, interestRate: 8,
  revenueCagr: 12, exitMultiple: 8,
};

/* ── component ── */
export default function CalculatorPage() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT);
  const [aiResult, setAiResult]   = useState<AIResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const set = (k: keyof Inputs, v: string | number) =>
    setInputs(p => ({ ...p, [k]: v }));

  /* ── derived metrics ── */
  const rev   = parseMoney(inputs.revenue);
  const ebt   = parseMoney(inputs.ebitda);
  const price = parseMoney(inputs.askingPrice);

  const ebitdaMargin  = rev  ? (ebt / rev) * 100 : 0;
  const evEbitda      = ebt  ? price / ebt        : 0;
  const evRevenue     = rev  ? price / rev         : 0;
  const debtAmt       = price * (inputs.debtPct / 100);
  const annualDebtSvc = debtAmt * (inputs.interestRate / 100);
  const debtEbitda    = ebt  ? debtAmt / ebt       : 0;
  const equityIn      = price * ((100 - inputs.debtPct) / 100);

  // 5-yr exit
  const exitEbitda  = ebt  * Math.pow(1 + inputs.revenueCagr / 100, 5);
  const exitVal     = exitEbitda * inputs.exitMultiple;
  const debtResidual= debtAmt * 0.7; // assume 30% paid down
  const equityExit  = Math.max(0, exitVal - debtResidual);
  const moic        = equityIn ? equityExit / equityIn : 0;
  const irr         = moic > 0 ? (Math.pow(moic, 1 / 5) - 1) * 100 : 0;
  const payback     = annualDebtSvc ? (debtAmt / (ebt - annualDebtSvc)) : 0;

  const metrics = {
    ebitdaMargin: fmt(ebitdaMargin),
    evEbitda:     fmt(evEbitda),
    evRevenue:    fmt(evRevenue),
    annualDebtService: money(annualDebtSvc),
    debtEbitda:   fmt(debtEbitda),
    exitValue:    money(exitVal),
    irr:          fmt(irr),
    moic:         fmt(moic, 2),
    paybackYears: fmt(payback),
  };

  const runAI = useCallback(async () => {
    if (!inputs.revenue || !inputs.ebitda || !inputs.askingPrice) {
      setError('Please fill in Revenue, EBITDA, and Asking Price first.');
      return;
    }
    setError('');
    setLoading(true);
    setAiResult(null);
    try {
      const res = await fetch('/api/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs, metrics }),
      });
      if (!res.ok) throw new Error('AI request failed');
      const text = await res.text();
      const parsed: AIResult = JSON.parse(text);
      setAiResult(parsed);
    } catch (e) {
      setError('AI analysis failed. Check your OpenAI key and try again.');
    } finally {
      setLoading(false);
    }
  }, [inputs, metrics]);

  /* ── input helper ── */
  const numInput = (label: string, key: keyof Inputs, unit = '', min = 0, max = 100) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>{label}</label>
      <div className="relative">
        <input
          type="number" min={min} max={max}
          value={inputs[key] as number}
          onChange={e => set(key, parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none pr-8"
          style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--onix-muted)' }}>{unit}</span>}
      </div>
    </div>
  );

  const textInput = (label: string, key: keyof Inputs, placeholder: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>{label}</label>
      <input
        type="text"
        value={inputs[key] as string}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        className="rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
      />
    </div>
  );

  const metricCard = (label: string, value: string, highlight = false) => (
    <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: 'var(--onix-card)', border: `1px solid ${highlight ? 'var(--onix-gold)' : 'var(--onix-border)'}` }}>
      <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>{label}</p>
      <p className="text-lg font-bold" style={{ color: highlight ? 'var(--onix-gold)' : 'var(--onix-text)' }}>{value}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold" style={{ color: 'var(--onix-text)' }}>Acquisitions Calculator</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--onix-muted)' }}>
          Model deal economics and get an AI-powered deal assessment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT: Inputs ── */}
        <div className="flex flex-col gap-5">

          {/* Company Financials */}
          <section className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>📊 Target Financials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {textInput('Annual Revenue', 'revenue', '$10M or ₹50Cr')}
              {textInput('EBITDA', 'ebitda', '$2M or ₹10Cr')}
              {textInput('Asking / EV', 'askingPrice', '$15M or ₹75Cr')}
            </div>
          </section>

          {/* Deal Structure */}
          <section className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>🤝 Deal Structure</h3>
            <div className="grid grid-cols-3 gap-3">
              {numInput('Cash %', 'cashPct', '%', 0, 100)}
              {numInput('Equity %', 'equityPct', '%', 0, 100)}
              {numInput('Earnout %', 'earnoutPct', '%', 0, 100)}
            </div>
            <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--onix-card)', color: 'var(--onix-muted)' }}>
              Total: {inputs.cashPct + inputs.equityPct + inputs.earnoutPct}%
              {inputs.cashPct + inputs.equityPct + inputs.earnoutPct !== 100 && (
                <span style={{ color: '#ef4444' }}> — should equal 100%</span>
              )}
            </div>
          </section>

          {/* Financing */}
          <section className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>🏦 Financing</h3>
            <div className="grid grid-cols-2 gap-3">
              {numInput('Debt Financing %', 'debtPct', '%', 0, 100)}
              {numInput('Interest Rate', 'interestRate', '%', 0, 30)}
            </div>
          </section>

          {/* Return Assumptions */}
          <section className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>📈 5-Year Return Assumptions</h3>
            <div className="grid grid-cols-2 gap-3">
              {numInput('Revenue CAGR', 'revenueCagr', '%', 0, 50)}
              {numInput('Exit Multiple (EV/EBITDA)', 'exitMultiple', 'x', 2, 30)}
            </div>
          </section>
        </div>

        {/* ── RIGHT: Metrics + AI ── */}
        <div className="flex flex-col gap-5">

          {/* Valuation Metrics */}
          <section className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>Valuation Metrics</h3>
            <div className="grid grid-cols-3 gap-3">
              {metricCard('EV/EBITDA', `${metrics.evEbitda}x`, true)}
              {metricCard('EV/Revenue', `${metrics.evRevenue}x`)}
              {metricCard('EBITDA Margin', `${metrics.ebitdaMargin}%`)}
            </div>
          </section>

          {/* Financing Metrics */}
          <section className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>Financing Metrics</h3>
            <div className="grid grid-cols-3 gap-3">
              {metricCard('Debt / EBITDA', `${metrics.debtEbitda}x`, parseFloat(metrics.debtEbitda) > 5)}
              {metricCard('Annual Debt Service', metrics.annualDebtService)}
              {metricCard('Equity Invested', money(equityIn))}
            </div>
          </section>

          {/* Returns */}
          <section className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>5-Year Returns</h3>
            <div className="grid grid-cols-2 gap-3">
              {metricCard('Est. IRR', `${metrics.irr}%`, true)}
              {metricCard('MOIC', `${metrics.moic}x`, true)}
              {metricCard('Exit Value', metrics.exitValue)}
              {metricCard('Debt Payback', `${metrics.paybackYears} yrs`)}
            </div>
          </section>

          {/* AI Button */}
          <button
            onClick={runAI}
            disabled={loading}
            className="w-full rounded-xl py-4 font-semibold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C96A)', color: '#0D0D0D' }}
          >
            {loading ? (
              <>
                <SpinIcon />
                Analyzing deal with AI…
              </>
            ) : (
              <>
                <SparkIcon />
                Get AI Deal Assessment
              </>
            )}
          </button>
          {error && <p className="text-xs text-center" style={{ color: '#ef4444' }}>{error}</p>}
        </div>
      </div>

      {/* ── AI Result ── */}
      {aiResult && (
        <div className="rounded-2xl p-6 flex flex-col gap-6" style={{ background: 'var(--onix-surface)', border: '2px solid var(--onix-gold)' }}>

          {/* Score + Verdict */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--onix-muted)' }}>AI DEAL ASSESSMENT</p>
              <h3 className="text-2xl font-bold" style={{ color: 'var(--onix-text)' }}>{aiResult.summary}</h3>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Score ring */}
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--onix-card)" strokeWidth="8"/>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--onix-gold)" strokeWidth="8"
                    strokeDasharray={`${(aiResult.dealScore / 100) * 201} 201`}
                    strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold" style={{ color: 'var(--onix-gold)' }}>{aiResult.dealScore}</span>
                  <span className="text-xs" style={{ color: 'var(--onix-muted)' }}>/100</span>
                </div>
              </div>
              <div
                className="px-4 py-2 rounded-xl font-bold text-sm"
                style={{ background: `${VERDICT_COLOR[aiResult.verdict] || '#888'}20`, color: VERDICT_COLOR[aiResult.verdict] || '#888' }}
              >
                {aiResult.verdict}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: '💰 Valuation', text: aiResult.valuationComment },
              { label: '🤝 Structure', text: aiResult.structureComment },
              { label: '🏦 Financing', text: aiResult.financingComment },
            ].map(c => (
              <div key={c.label} className="rounded-xl p-4" style={{ background: 'var(--onix-card)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--onix-gold)' }}>{c.label}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--onix-muted)' }}>{c.text}</p>
              </div>
            ))}
          </div>

          {/* Strengths / Risks / Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: '#22c55e' }}>✓ Strengths</p>
              <ul className="flex flex-col gap-2">
                {aiResult.strengths.map((s, i) => (
                  <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: 'var(--onix-muted)' }}>
                    <span style={{ color: '#22c55e', flexShrink: 0 }}>•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: '#ef4444' }}>⚠ Risks</p>
              <ul className="flex flex-col gap-2">
                {aiResult.risks.map((r, i) => (
                  <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: 'var(--onix-muted)' }}>
                    <span style={{ color: '#ef4444', flexShrink: 0 }}>•</span>{r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--onix-gold)' }}>→ Recommendations</p>
              <ul className="flex flex-col gap-2">
                {aiResult.recommendations.map((r, i) => (
                  <li key={i} className="text-xs leading-relaxed flex gap-2" style={{ color: 'var(--onix-muted)' }}>
                    <span style={{ color: 'var(--onix-gold)', flexShrink: 0 }}>•</span>{r}
                  </li>
                ))}
              </ul>
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
