'use client';

import { useState, useMemo } from 'react';

export default function DebtEnginePage() {
  const [dealValue,    setDealValue]    = useState('10000000');
  const [equityPct,    setEquityPct]    = useState('30');
  const [interestRate, setInterestRate] = useState('8.5');
  const [termYears,    setTermYears]    = useState('5');
  const [ebitda,       setEbitda]       = useState('2000000');

  const results = useMemo(() => {
    const dv   = parseFloat(dealValue)    || 0;
    const eq   = parseFloat(equityPct)    || 0;
    const rate = parseFloat(interestRate) || 0;
    const term = parseFloat(termYears)    || 1;
    const eb   = parseFloat(ebitda)       || 0;
    const debtAmount    = dv * (1 - eq / 100);
    const equityAmount  = dv * (eq / 100);
    const monthlyRate   = rate / 100 / 12;
    const n             = term * 12;
    const monthlyPmt    = monthlyRate > 0
      ? debtAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
      : debtAmount / n;
    const annualDebt    = monthlyPmt * 12;
    const totalInterest = monthlyPmt * n - debtAmount;
    const dscr          = eb > 0 ? eb / annualDebt : 0;
    const ltv           = dv > 0 ? (debtAmount / dv) * 100 : 0;
    return { debtAmount, equityAmount, monthlyPmt, annualDebt, totalInterest, dscr, ltv };
  }, [dealValue, equityPct, interestRate, termYears, ebitda]);

  const dscrColor = results.dscr >= 1.25 ? 'var(--onix-green)' : results.dscr >= 1.0 ? 'var(--onix-amber)' : 'var(--onix-red)';
  const dscrLabel = results.dscr >= 1.25 ? 'Healthy' : results.dscr >= 1.0 ? 'Marginal' : 'At Risk';

  function fmt(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  }

  const inp: React.CSSProperties = {
    background: 'var(--onix-surface)',
    border: '1px solid var(--onix-border)',
    color: 'var(--onix-text)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  };
  const lbl: React.CSSProperties = { fontSize: 12, color: 'var(--onix-muted)', marginBottom: 6, display: 'block', fontWeight: 500 };

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--onix-text)' }}>Debt Engine Calculator</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--onix-muted)' }}>Model acquisition debt structure, repayments & serviceability</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* ── Inputs ── */}
        <div className="rounded-xl p-6 flex flex-col gap-5" style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>Deal Parameters</h2>

          <div><label style={lbl}>Deal / Acquisition Value ($)</label>
            <input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} style={inp} placeholder="10000000" /></div>

          <div><label style={lbl}>Equity Contribution (%)</label>
            <input type="number" value={equityPct} onChange={e => setEquityPct(e.target.value)} style={inp} placeholder="30" min="0" max="100" /></div>

          <div><label style={lbl}>Interest Rate (% p.a.)</label>
            <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} style={inp} placeholder="8.5" step="0.1" /></div>

          <div><label style={lbl}>Loan Term (Years)</label>
            <input type="number" value={termYears} onChange={e => setTermYears(e.target.value)} style={inp} placeholder="5" min="1" max="30" /></div>

          <div><label style={lbl}>Target EBITDA ($)</label>
            <input type="number" value={ebitda} onChange={e => setEbitda(e.target.value)} style={inp} placeholder="2000000" /></div>

          {/* LTV Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--onix-muted)' }}>Loan-to-Value (LTV)</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--onix-gold)' }}>{results.ltv.toFixed(1)}%</span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: 'var(--onix-border)' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${Math.min(results.ltv, 100)}%`,
                background: results.ltv > 80 ? 'var(--onix-red)' : results.ltv > 65 ? 'var(--onix-amber)' : 'var(--onix-gold)',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--onix-muted)', marginTop: 6 }}>
              {results.ltv > 80 ? 'High LTV — lenders may require additional collateral' : results.ltv > 65 ? 'Moderate LTV — acceptable for most lenders' : 'Strong LTV — favourable lending conditions'}
            </p>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="flex flex-col gap-4">

          {/* DSCR Card */}
          <div className="rounded-xl p-6" style={{ background: 'var(--onix-card)', border: `1px solid ${dscrColor}40`, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--onix-muted)', margin: '0 0 6px' }}>Debt Service Coverage Ratio</p>
            <p style={{ fontSize: 48, fontWeight: 700, color: dscrColor, margin: 0, lineHeight: 1 }}>{results.dscr.toFixed(2)}x</p>
            <span style={{ fontSize: 12, fontWeight: 600, color: dscrColor, background: `${dscrColor}20`, borderRadius: 20, padding: '3px 14px', display: 'inline-block', marginTop: 10 }}>{dscrLabel}</span>
            <p style={{ fontSize: 11, color: 'var(--onix-muted)', margin: '10px 0 0' }}>Lenders typically require ≥ 1.25x to approve financing</p>
          </div>

          {/* Metric Cards */}
          <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}>
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--onix-text)' }}>Debt Summary</h2>
            {[
              { label: 'Debt Amount',         value: fmt(results.debtAmount) },
              { label: 'Equity Required',     value: fmt(results.equityAmount) },
              { label: 'Monthly Payment',     value: fmt(results.monthlyPmt) },
              { label: 'Annual Debt Service', value: fmt(results.annualDebt) },
              { label: 'Total Interest Paid', value: fmt(results.totalInterest) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 8, background: 'var(--onix-surface)' }}>
                <span style={{ fontSize: 13, color: 'var(--onix-muted)' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--onix-text)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guidance Banner */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}>
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--onix-gold)' }}>Debt Structuring Notes</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Senior Debt',       desc: 'Typically 50–60% LTV. Lower rates, first lien. Banks and NBFCs.' },
            { title: 'Mezzanine / Sub',   desc: 'Fills the gap between senior debt and equity. Higher cost, flexible terms.' },
            { title: 'Vendor Finance',    desc: 'Seller carries part of the purchase price. Aligns incentives post-close.' },
          ].map(({ title, desc }) => (
            <div key={title}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--onix-gold)', marginBottom: 4 }}>{title}</p>
              <p style={{ fontSize: 12, color: 'var(--onix-muted)', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
