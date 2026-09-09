'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDeals } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

const MA_STAGES = [
  { key: 'sourcing',     label: 'Sourcing',     icon: '📋', desc: 'Deal identified and profiled' },
  { key: 'valuation',   label: 'Valuation',    icon: '💰', desc: 'Business valued across methods' },
  { key: 'matching',    label: 'Matching',     icon: '🎯', desc: 'Buyer / investor matched' },
  { key: 'dd',          label: 'Due Diligence',icon: '🔍', desc: 'DD checklist completed' },
  { key: 'modeling',    label: 'Modeling',     icon: '📊', desc: 'Financial model built' },
  { key: 'negotiation', label: 'Negotiation',  icon: '🤝', desc: 'Terms agreed' },
  { key: 'closing',     label: 'Closing',      icon: '✅', desc: 'Transaction executed' },
];

interface DDItem { id: string; text: string; priority: 'High'|'Medium'|'Low'; done: boolean; }
interface DDCategory { name: string; icon: string; items: DDItem[]; }

const PRIORITY_COLOR = { High: '#ef4444', Medium: '#f97316', Low: '#888' };

export default function DealRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [activeTab, setActiveTab] = useState<'overview'|'dd'|'matching'|'termsheet'|'closing'>('overview');
  const [activeStage, setActiveStage] = useState(0);

  // DD state
  const [ddCategories, setDdCategories] = useState<DDCategory[]>([]);
  const [ddLoading, setDdLoading] = useState(false);
  const [ddExpanded, setDdExpanded] = useState<string[]>([]);

  // Term sheet state
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [termSheet, setTermSheet] = useState('');
  const [tsLoading, setTsLoading] = useState(false);

  // Closing checklist
  const [closingItems, setClosingItems] = useState([
    { id: '1', text: 'Final SPA / transaction docs signed', done: false },
    { id: '2', text: 'Regulatory / antitrust clearance obtained', done: false },
    { id: '3', text: 'Shareholder approval received', done: false },
    { id: '4', text: 'Funds transferred / escrow released', done: false },
    { id: '5', text: 'Board resolutions passed', done: false },
    { id: '6', text: 'Management handover completed', done: false },
    { id: '7', text: 'Post-close integration plan activated', done: false },
    { id: '8', text: 'Filing with regulatory authorities done', done: false },
  ]);

  const { data: deals = [] } = useQuery({ queryKey: ['deals'], queryFn: fetchDeals });
  const deal = deals.find(d => d.id === id);

  // Set initial stage from deal stage
  useEffect(() => {
    if (deal) {
      const stageMap: Record<string,number> = { Diagnose:0, Prepare:1, Match:2, Outreach:3, Close:6 };
      setActiveStage(stageMap[deal.stage] ?? 0);
    }
  }, [deal]);

  async function generateDD() {
    if (!deal) return;
    setDdLoading(true);
    try {
      const res = await fetch('/api/dd-checklist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealName: deal.name, sector: deal.sector, dealType: 'M&A', value: deal.value }),
      });
      const data = await res.json();
      setDdCategories(data.categories || []);
      setDdExpanded(data.categories?.map((c: DDCategory) => c.name) || []);
    } catch { alert('Failed to generate DD checklist.'); }
    finally { setDdLoading(false); }
  }

  function toggleDDItem(catName: string, itemId: string) {
    setDdCategories(prev => prev.map(cat =>
      cat.name !== catName ? cat : {
        ...cat,
        items: cat.items.map(item => item.id === itemId ? { ...item, done: !item.done } : item),
      }
    ));
  }

  async function generateTermSheet() {
    if (!deal) return;
    setTsLoading(true); setTermSheet('');
    try {
      const res = await fetch('/api/term-sheet', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal, notes: negotiationNotes }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
        setTermSheet(text);
      }
    } catch { alert('Failed to generate term sheet.'); }
    finally { setTsLoading(false); }
  }

  const ddTotal = ddCategories.reduce((s, c) => s + c.items.length, 0);
  const ddDone  = ddCategories.reduce((s, c) => s + c.items.filter(i => i.done).length, 0);
  const ddPct   = ddTotal ? Math.round((ddDone / ddTotal) * 100) : 0;
  const closingDone = closingItems.filter(i => i.done).length;
  const closingPct  = Math.round((closingDone / closingItems.length) * 100);

  if (!deal && deals.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p style={{ color: 'var(--onix-muted)' }}>Deal not found.</p>
        <button onClick={() => router.push('/deal-room')} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}>← Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Back + header */}
      <div>
        <button onClick={() => router.push('/deal-room')} className="text-xs mb-3 flex items-center gap-1" style={{ color: 'var(--onix-muted)' }}>
          ← All Deal Rooms
        </button>
        {deal && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--onix-text)' }}>{deal.name}</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--onix-muted)' }}>{deal.sector} · {deal.value} · Fit {deal.fit_score}/100</p>
            </div>
          </div>
        )}
      </div>

      {/* M&A Stage pipeline */}
      <div className="rounded-xl p-5" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
        <p className="text-xs font-semibold mb-4" style={{ color: 'var(--onix-muted)' }}>M&A STAGE PIPELINE</p>
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {MA_STAGES.map((stage, i) => (
            <div key={stage.key} className="flex items-center">
              <button
                onClick={() => setActiveStage(i)}
                className="flex flex-col items-center gap-1 px-2 min-w-[72px] transition-all"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base transition-all"
                  style={{ background: i < activeStage ? '#22c55e20' : i === activeStage ? 'rgba(201,168,76,0.15)' : 'var(--onix-card)', border: `2px solid ${i < activeStage ? '#22c55e' : i === activeStage ? 'var(--onix-gold)' : 'var(--onix-border)'}` }}>
                  {i < activeStage ? '✓' : stage.icon}
                </div>
                <span className="text-xs text-center leading-tight" style={{ color: i === activeStage ? 'var(--onix-gold)' : i < activeStage ? '#22c55e' : 'var(--onix-muted)' }}>
                  {stage.label}
                </span>
              </button>
              {i < MA_STAGES.length - 1 && (
                <div className="h-0.5 w-4 flex-shrink-0" style={{ background: i < activeStage ? '#22c55e' : 'var(--onix-border)' }}/>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--onix-muted)' }}>
          Current: <span style={{ color: 'var(--onix-gold)' }}>{MA_STAGES[activeStage]?.label}</span> — {MA_STAGES[activeStage]?.desc}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
        {([
          { key: 'overview',   label: '📊 Overview' },
          { key: 'dd',         label: `🔍 Due Diligence${ddTotal ? ` (${ddDone}/${ddTotal})` : ''}` },
          { key: 'matching',   label: '🎯 Matching' },
          { key: 'termsheet',  label: '📄 Term Sheet' },
          { key: 'closing',    label: `✅ Closing${closingDone ? ` (${closingDone}/${closingItems.length})` : ''}` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            style={{ background: activeTab === t.key ? 'var(--onix-gold)' : 'transparent', color: activeTab === t.key ? '#0D0D0D' : 'var(--onix-muted)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && deal && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Deal Value', value: deal.value || '—' },
            { label: 'Fit Score',  value: `${deal.fit_score}/100` },
            { label: 'Stage',      value: deal.stage },
            { label: 'Status',     value: deal.status },
            { label: 'Sector',     value: deal.sector || '—' },
            { label: 'DD Progress', value: ddTotal ? `${ddPct}%` : 'Not started' },
            { label: 'Closing',    value: closingDone ? `${closingPct}%` : 'Not started' },
            { label: 'M&A Phase',  value: MA_STAGES[activeStage]?.label },
          ].map(m => (
            <div key={m.label} className="rounded-xl p-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--onix-muted)' }}>{m.label}</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'dd' && (
        <div className="flex flex-col gap-4">
          {!ddCategories.length ? (
            <div className="flex flex-col items-center gap-4 py-12 rounded-xl" style={{ background: 'var(--onix-surface)', border: '1px dashed var(--onix-border)' }}>
              <span style={{ fontSize: 40 }}>🔍</span>
              <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>AI will generate a sector-specific DD checklist for this deal</p>
              <button onClick={generateDD} disabled={ddLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center gap-2"
                style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}>
                {ddLoading ? <><SpinIcon/> Generating…</> : <><SparkIcon/> Generate DD Checklist</>}
              </button>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--onix-text)' }}>DD Progress</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--onix-gold)' }}>{ddDone}/{ddTotal} items</span>
                  </div>
                  <div className="rounded-full h-2" style={{ background: 'var(--onix-card)' }}>
                    <div className="rounded-full h-2 transition-all" style={{ width: `${ddPct}%`, background: ddPct === 100 ? '#22c55e' : 'var(--onix-gold)' }}/>
                  </div>
                </div>
                <span className="text-2xl font-bold" style={{ color: ddPct === 100 ? '#22c55e' : 'var(--onix-gold)' }}>{ddPct}%</span>
                <button onClick={generateDD} disabled={ddLoading} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--onix-card)', color: 'var(--onix-muted)' }}>
                  Regenerate
                </button>
              </div>

              {ddCategories.map(cat => {
                const expanded = ddExpanded.includes(cat.name);
                const catDone  = cat.items.filter(i => i.done).length;
                return (
                  <div key={cat.name} className="rounded-xl overflow-hidden" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
                    <button onClick={() => setDdExpanded(p => p.includes(cat.name) ? p.filter(n => n !== cat.name) : [...p, cat.name])}
                      className="w-full flex items-center justify-between px-4 py-3">
                      <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--onix-text)' }}>
                        {cat.icon} {cat.name}
                        <span className="text-xs font-normal" style={{ color: 'var(--onix-muted)' }}>{catDone}/{cat.items.length}</span>
                      </span>
                      <span style={{ color: 'var(--onix-muted)' }}>{expanded ? '▲' : '▼'}</span>
                    </button>
                    {expanded && (
                      <div className="flex flex-col divide-y" style={{ borderTop: '1px solid var(--onix-border)' }}>
                        {cat.items.map(item => (
                          <div key={item.id} className="flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-all"
                            style={{ background: item.done ? 'rgba(34,197,94,0.04)' : 'transparent' }}
                            onClick={() => toggleDDItem(cat.name, item.id)}>
                            <div className="w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center"
                              style={{ background: item.done ? '#22c55e' : 'var(--onix-card)', border: `1.5px solid ${item.done ? '#22c55e' : 'var(--onix-border)'}` }}>
                              {item.done && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                            </div>
                            <span className="flex-1 text-xs leading-relaxed" style={{ color: item.done ? 'var(--onix-muted)' : 'var(--onix-text)', textDecoration: item.done ? 'line-through' : 'none' }}>
                              {item.text}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                              style={{ background: `${PRIORITY_COLOR[item.priority]}15`, color: PRIORITY_COLOR[item.priority] }}>
                              {item.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {activeTab === 'matching' && (
        <div className="rounded-xl p-6 flex flex-col items-center gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
          <span style={{ fontSize: 40 }}>🎯</span>
          <p className="text-sm text-center" style={{ color: 'var(--onix-muted)' }}>
            Use the Matching Engine to find buyers and investors for this deal
          </p>
          <a href="/matching"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}>
            Open Matching Engine →
          </a>
        </div>
      )}

      {activeTab === 'termsheet' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>Negotiation Notes</h3>
            <textarea rows={4} value={negotiationNotes} onChange={e => setNegotiationNotes(e.target.value)}
              placeholder="Key negotiated terms, buyer requests, price adjustments, earn-out structure, exclusivity period…"
              className="rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}/>
            <button onClick={generateTermSheet} disabled={tsLoading}
              className="self-start px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
              style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}>
              {tsLoading ? <><SpinIcon/> Generating…</> : <><SparkIcon/> Generate Term Sheet</>}
            </button>
          </div>

          {termSheet && (
            <div className="rounded-xl p-5" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>AI-Generated Term Sheet</h3>
                <button onClick={() => navigator.clipboard.writeText(termSheet)}
                  className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--onix-card)', color: 'var(--onix-muted)' }}>
                  Copy
                </button>
              </div>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--onix-muted)', fontFamily: 'inherit' }}>
                {termSheet}
              </pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'closing' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--onix-text)' }}>Closing Progress</span>
                <span className="text-xs font-bold" style={{ color: closingPct === 100 ? '#22c55e' : 'var(--onix-gold)' }}>{closingDone}/{closingItems.length}</span>
              </div>
              <div className="rounded-full h-2" style={{ background: 'var(--onix-card)' }}>
                <div className="rounded-full h-2 transition-all" style={{ width: `${closingPct}%`, background: closingPct === 100 ? '#22c55e' : 'var(--onix-gold)' }}/>
              </div>
            </div>
            <span className="text-2xl font-bold" style={{ color: closingPct === 100 ? '#22c55e' : 'var(--onix-gold)' }}>{closingPct}%</span>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>
            {closingItems.map((item, i) => (
              <div key={item.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                style={{ background: item.done ? 'rgba(34,197,94,0.04)' : 'transparent', borderTop: i > 0 ? '1px solid var(--onix-border)' : 'none' }}
                onClick={() => setClosingItems(p => p.map(ci => ci.id === item.id ? { ...ci, done: !ci.done } : ci))}>
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: item.done ? '#22c55e' : 'var(--onix-card)', border: `2px solid ${item.done ? '#22c55e' : 'var(--onix-border)'}` }}>
                  {item.done && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                </div>
                <span className="text-sm flex-1" style={{ color: item.done ? 'var(--onix-muted)' : 'var(--onix-text)', textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SparkIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>;
}
function SpinIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="animate-spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
}
