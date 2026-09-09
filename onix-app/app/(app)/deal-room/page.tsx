'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDeals } from '@/lib/api';
import Link from 'next/link';

const STAGE_ORDER = ['Diagnose','Prepare','Match','Outreach','Close'];
const STAGE_COLOR: Record<string,string> = {
  Diagnose:'#60a5fa', Prepare:'#a78bfa', Match:'#C9A84C', Outreach:'#f97316', Close:'#22c55e',
};

export default function DealRoomListPage() {
  const { data: deals = [], isLoading } = useQuery({ queryKey: ['deals'], queryFn: fetchDeals });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--onix-text)' }}>Deal Room</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--onix-muted)' }}>Full M&A workflow — sourcing to closing</p>
        </div>
        <Link href="/pipeline"
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}>
          + Add Deal
        </Link>
      </div>

      {/* Stage legend */}
      <div className="flex flex-wrap gap-3">
        {STAGE_ORDER.map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLOR[s] }}/>
            <span className="text-xs" style={{ color: 'var(--onix-muted)' }}>{s}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>Loading deals…</p>
      ) : deals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <span style={{ fontSize: 40 }}>🏛️</span>
          <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>No deals yet. Add a deal from Pipeline to open its Deal Room.</p>
          <Link href="/pipeline" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}>Go to Pipeline</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {deals.map(deal => {
            const stageIdx = STAGE_ORDER.indexOf(deal.stage);
            const progress = Math.round(((stageIdx + 1) / STAGE_ORDER.length) * 100);
            return (
              <Link key={deal.id} href={`/deal-room/${deal.id}`}
                className="rounded-xl p-5 flex flex-col gap-4 transition-all hover:border-[var(--onix-gold)]"
                style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)', textDecoration: 'none' }}>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--onix-text)' }}>{deal.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--onix-muted)' }}>{deal.sector} · {deal.value}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: `${STAGE_COLOR[deal.stage]}20`, color: STAGE_COLOR[deal.stage] }}>
                    {deal.stage}
                  </span>
                </div>

                {/* 7-stage M&A progress */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--onix-muted)' }}>M&A Progress</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--onix-gold)' }}>{progress}%</span>
                  </div>
                  <div className="rounded-full h-1.5" style={{ background: 'var(--onix-card)' }}>
                    <div className="rounded-full h-1.5 transition-all" style={{ width: `${progress}%`, background: STAGE_COLOR[deal.stage] || 'var(--onix-gold)' }}/>
                  </div>
                  <div className="flex justify-between mt-1">
                    {STAGE_ORDER.map((s, i) => (
                      <div key={s} className="w-2 h-2 rounded-full" style={{ background: i <= stageIdx ? STAGE_COLOR[s] : 'var(--onix-border)' }}/>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--onix-muted)' }}>Fit Score: <strong style={{ color: 'var(--onix-text)' }}>{deal.fit_score}/100</strong></span>
                  <span className="text-xs font-medium" style={{ color: 'var(--onix-gold)' }}>Open Deal Room →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
