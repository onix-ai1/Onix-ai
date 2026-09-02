'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { upsertWorkspace } from '@/lib/api';

/* ── Constants ─────────────────────────────────────────────────────── */
const TOTAL_STEPS = 4;

const INDUSTRIES = [
  'Technology & SaaS', 'Healthcare & Life Sciences', 'Financial Services',
  'Real Estate', 'Energy & Infrastructure', 'Manufacturing',
  'Consumer & Retail', 'Media & Entertainment', 'Education', 'Other',
];

const SIZES = ['Solo / 1 person', '2–10', '11–50', '51–200', '200+'];

const ROLES = [
  { id: 'buyer',   label: 'Acquirer / Buyer',     desc: 'Looking to acquire businesses or assets', icon: '🎯' },
  { id: 'seller',  label: 'Seller / Founder',      desc: 'Planning to exit or sell my business',    icon: '🏢' },
  { id: 'raiser',  label: 'Capital Raiser',         desc: 'Raising equity or debt funding',          icon: '📈' },
  { id: 'advisor', label: 'Advisor / Intermediary', desc: 'M&A advisor, banker, or broker',          icon: '🤝' },
];

const GOALS = [
  { id: 'acquire',  label: 'Acquire a Business',   icon: '🎯' },
  { id: 'sell',     label: 'Sell My Business',      icon: '💼' },
  { id: 'raise',    label: 'Raise Capital',         icon: '📈' },
  { id: 'invest',   label: 'Invest / PE / VC',      icon: '🏦' },
  { id: 'diligence',label: 'Run Due Diligence',     icon: '🔍' },
  { id: 'advisory', label: 'Advisory Services',     icon: '🤝' },
];

/* ── Page ─────────────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [name, setName]       = useState('');
  const [role, setRole]       = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize]       = useState('');
  const [website, setWebsite] = useState('');
  const [goals, setGoals]     = useState<string[]>([]);
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);

  // Load user name from session
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) {
        setName(user.user_metadata.full_name.split(' ')[0]);
      }
    });
  }, []);

  function toggleGoal(id: string) {
    setGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const supabase = createClient();

      // 1. Save workspace
      if (company) {
        await upsertWorkspace({ name: company, company, industry, website, size });
      }

      // 2. Mark onboarding complete in user metadata
      await supabase.auth.updateUser({
        data: { onboarding_complete: true, role, goals },
      });

      setDone(true);
    } catch {
      // Proceed anyway — don't block user
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (step < TOTAL_STEPS) setStep(s => s + 1);
    else handleFinish();
  }

  function goBack() {
    if (step > 1) setStep(s => s - 1);
  }

  function enterDashboard() {
    router.push('/dashboard');
  }

  const canNext =
    step === 1 ? !!role :
    step === 2 ? !!company && !!industry :
    step === 3 ? goals.length > 0 :
    true;

  if (done) {
    return <DoneScreen name={name} onEnter={enterDashboard} />;
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--onix-dark)', cursor: 'auto' }}>

      {/* ── Left panel ────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: 'var(--onix-surface)', borderRight: '1px solid var(--onix-border)' }}
      >
        {/* Decorative glows */}
        <div
          className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)', transform: 'translate(30%, 30%)' }}
        />

        {/* Logo */}
        <div>
          <Image src="/logo.png" alt="ONIX AI" width={110} height={36} style={{ objectFit: 'contain' }} />
        </div>

        {/* Steps sidebar */}
        <div className="flex flex-col gap-3">
          {[
            { n: 1, label: 'Your Role',        sub: 'How you plan to use ONIX' },
            { n: 2, label: 'Company Details',  sub: 'About your organisation' },
            { n: 3, label: 'Deal Goals',        sub: 'What you want to achieve' },
            { n: 4, label: 'You\'re Ready',     sub: 'Enter your deal room' },
          ].map(s => {
            const isActive    = step === s.n;
            const isComplete  = step > s.n;
            return (
              <div key={s.n} className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all mt-0.5"
                  style={{
                    background: isComplete ? 'var(--onix-gold)' : isActive ? 'rgba(201,168,76,0.2)' : 'var(--onix-card)',
                    border:     isActive ? '1.5px solid var(--onix-gold)' : isComplete ? 'none' : '1px solid var(--onix-border)',
                    color:      isComplete ? '#0D0D0D' : isActive ? 'var(--onix-gold)' : 'var(--onix-muted)',
                  }}
                >
                  {isComplete ? '✓' : s.n}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: isActive ? 'var(--onix-text)' : isComplete ? 'var(--onix-text)' : 'var(--onix-muted)' }}>
                    {s.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>{s.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--onix-muted)' }}>
            Platform at a glance
          </p>
          {[
            { label: 'Active Deal Listings', value: '10,000+' },
            { label: 'Total Deal Flow',       value: '$2.8B' },
            { label: 'Countries Served',      value: '68' },
            { label: 'AI Accuracy Rate',      value: '94%' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs" style={{ color: 'var(--onix-muted)' }}>{label}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--onix-gold)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Image src="/logo.png" alt="ONIX AI" width={100} height={32} style={{ objectFit: 'contain' }} />
        </div>

        {/* Progress bar — mobile */}
        <div className="lg:hidden w-full max-w-md mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--onix-muted)' }}>Step {step} of {TOTAL_STEPS}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--onix-gold)' }}>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="h-1 rounded-full w-full" style={{ background: 'var(--onix-border)' }}>
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: 'var(--onix-gold)' }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="w-full max-w-lg">
          {step === 1 && (
            <StepRole name={name} selected={role} onSelect={setRole} />
          )}
          {step === 2 && (
            <StepCompany
              company={company} setCompany={setCompany}
              industry={industry} setIndustry={setIndustry}
              size={size} setSize={setSize}
              website={website} setWebsite={setWebsite}
            />
          )}
          {step === 3 && (
            <StepGoals selected={goals} onToggle={toggleGoal} />
          )}
          {step === 4 && (
            <StepReview name={name} role={role} company={company} goals={goals} />
          )}
        </div>

        {/* Navigation */}
        <div className="w-full max-w-lg mt-8 flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={goBack}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ border: '1px solid var(--onix-border)', color: 'var(--onix-muted)', background: 'transparent' }}
            >
              Back
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canNext || saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
          >
            {saving ? 'Setting up…' : step === TOTAL_STEPS ? 'Enter My Deal Room →' : 'Continue →'}
          </button>
        </div>

        {step === 1 && (
          <button
            onClick={() => { setRole(''); goNext(); }}
            className="mt-3 text-xs"
            style={{ color: 'var(--onix-muted)' }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Step 1: Role ──────────────────────────────────────────────────── */
function StepRole({ name, selected, onSelect }: {
  name: string;
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--onix-gold)' }}>
          Step 1 of 4
        </p>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--onix-text)' }}>
          Welcome{name ? `, ${name}` : ''} 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>
          Tell us your primary role so we can personalise your ONIX AI experience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLES.map(r => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="text-left p-4 rounded-xl transition-all"
            style={{
              background: selected === r.id ? 'rgba(201,168,76,0.1)' : 'var(--onix-card)',
              border:     selected === r.id ? '1.5px solid var(--onix-gold)' : '1px solid var(--onix-border)',
            }}
          >
            <div className="text-xl mb-2">{r.icon}</div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--onix-text)' }}>{r.label}</p>
            <p className="text-xs" style={{ color: 'var(--onix-muted)' }}>{r.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Step 2: Company ───────────────────────────────────────────────── */
function StepCompany({
  company, setCompany, industry, setIndustry, size, setSize, website, setWebsite,
}: {
  company: string; setCompany: (v: string) => void;
  industry: string; setIndustry: (v: string) => void;
  size: string; setSize: (v: string) => void;
  website: string; setWebsite: (v: string) => void;
}) {
  const inputStyle: React.CSSProperties = {
    background:   'var(--onix-card)',
    border:       '1px solid var(--onix-border)',
    color:        'var(--onix-text)',
    borderRadius: '10px',
    padding:      '10px 14px',
    fontSize:     '14px',
    width:        '100%',
    outline:      'none',
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--onix-gold)' }}>
          Step 2 of 4
        </p>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--onix-text)' }}>
          About Your Company
        </h1>
        <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>
          This helps us surface the most relevant deals and contacts for you.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--onix-muted)' }}>
            Company / Fund Name <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Acme Capital Partners"
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--onix-muted)' }}>
            Industry / Sector <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="">Select your industry…</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--onix-muted)' }}>Team Size</label>
          <div className="flex flex-wrap gap-2">
            {SIZES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: size === s ? 'rgba(201,168,76,0.15)' : 'var(--onix-card)',
                  border:     size === s ? '1.5px solid var(--onix-gold)' : '1px solid var(--onix-border)',
                  color:      size === s ? 'var(--onix-gold)' : 'var(--onix-muted)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--onix-muted)' }}>Website</label>
          <input
            type="url"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://example.com"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Step 3: Goals ─────────────────────────────────────────────────── */
function StepGoals({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--onix-gold)' }}>
          Step 3 of 4
        </p>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--onix-text)' }}>
          What Are Your Goals?
        </h1>
        <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>
          Select all that apply — you can always change this later.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(g => {
          const active = selected.includes(g.id);
          return (
            <button
              key={g.id}
              onClick={() => onToggle(g.id)}
              className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
              style={{
                background: active ? 'rgba(201,168,76,0.1)' : 'var(--onix-card)',
                border:     active ? '1.5px solid var(--onix-gold)' : '1px solid var(--onix-border)',
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ background: active ? 'rgba(201,168,76,0.2)' : 'var(--onix-surface)' }}
              >
                {g.icon}
              </div>
              <span className="text-sm font-medium" style={{ color: active ? 'var(--onix-text)' : 'var(--onix-muted)' }}>
                {g.label}
              </span>
              {active && (
                <span className="ml-auto text-xs font-bold" style={{ color: 'var(--onix-gold)' }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-xs mt-4" style={{ color: 'var(--onix-gold)' }}>
          {selected.length} goal{selected.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}

/* ── Step 4: Review ────────────────────────────────────────────────── */
function StepReview({ name, role, company, goals }: {
  name: string; role: string; company: string; goals: string[];
}) {
  const roleLabel  = ROLES.find(r => r.id === role)?.label ?? role;
  const goalLabels = goals.map(g => GOALS.find(x => x.id === g)?.label).filter(Boolean);

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--onix-gold)' }}>
          Step 4 of 4
        </p>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--onix-text)' }}>
          You&apos;re All Set{name ? `, ${name}` : ''}!
        </h1>
        <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>
          Review your setup, then enter your personalised deal room.
        </p>
      </div>

      <div
        className="rounded-xl p-5 space-y-4"
        style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}
      >
        {role && (
          <ReviewRow label="Your Role" value={roleLabel} />
        )}
        {company && (
          <ReviewRow label="Company" value={company} />
        )}
        {goals.length > 0 && (
          <ReviewRow label="Goals" value={goalLabels.join(' · ')} />
        )}

        <div
          className="pt-4 flex items-start gap-3 mt-2"
          style={{ borderTop: '1px solid var(--onix-border)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid var(--onix-gold)' }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--onix-gold)" strokeWidth={1.8}>
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--onix-text)' }}>AI Co-Pilot is ready</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--onix-muted)' }}>
              GPT-4o powered advisor trained on M&A and capital markets — available from your sidebar.
            </p>
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        {[
          { icon: '🎯', label: 'Smart Deal Matching' },
          { icon: '📊', label: 'AI Valuation' },
          { icon: '🔒', label: 'Secure Data Room' },
        ].map(f => (
          <div
            key={f.label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)' }}
          >
            <div className="text-xl mb-1">{f.icon}</div>
            <p className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>{f.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs font-medium flex-shrink-0 mt-0.5" style={{ color: 'var(--onix-muted)' }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: 'var(--onix-text)' }}>{value}</span>
    </div>
  );
}

/* ── Done screen ───────────────────────────────────────────────────── */
function DoneScreen({ name, onEnter }: { name: string; onEnter: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--onix-dark)' }}
    >
      {/* Animated success ring */}
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(201,168,76,0.12)', border: '2px solid var(--onix-gold)' }}
        >
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--onix-gold)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        {/* Pulse rings */}
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: 'rgba(201,168,76,0.08)', animationDuration: '1.5s' }}
        />
      </div>

      <Image src="/logo.png" alt="ONIX AI" width={120} height={40} style={{ objectFit: 'contain', marginBottom: '24px' }} />

      <h1 className="text-3xl font-semibold mb-3" style={{ color: 'var(--onix-text)' }}>
        Welcome to ONIX AI{name ? `, ${name}` : ''}
      </h1>
      <p className="text-base max-w-sm mb-2" style={{ color: 'var(--onix-muted)' }}>
        Your deal room is personalised and ready.
      </p>
      <p className="text-sm max-w-sm mb-10" style={{ color: 'var(--onix-muted)' }}>
        Manage your pipeline, track investors, and use AI Co-Pilot to accelerate every deal.
      </p>

      <button
        onClick={onEnter}
        className="px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
      >
        Enter My Deal Room →
      </button>

      <div className="flex items-center gap-6 mt-10">
        {[
          { icon: '🔒', label: 'Bank-grade Security' },
          { icon: '🌍', label: '68 Countries' },
          { icon: '🤖', label: 'GPT-4o Powered' },
        ].map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span>{icon}</span>
            <span className="text-xs" style={{ color: 'var(--onix-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
