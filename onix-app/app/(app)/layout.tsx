'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logoutRequest } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/theme';

const NAV_SECTIONS = [
  {
    label: 'DEAL ROOM',
    items: [
      { href: '/dashboard',   label: 'Dashboard',        icon: GridIcon,       count: null },
      { href: '/pipeline',    label: 'Pipeline',         icon: FunnelIcon,     count: null },
      { href: '/deal-room',   label: 'Deal Room',        icon: DealRoomIcon,   count: null },
      { href: '/calculator',  label: 'Acq. Calculator',  icon: CalcIcon,       count: null },
      { href: '/valuation',   label: 'Valuation',        icon: ValuationIcon,  count: null },
    ],
  },
  {
    label: 'NETWORK',
    items: [
      { href: '/investors',  label: 'Investors',   icon: UsersIcon,    count: null },
      { href: '/matching',   label: 'Matching',    icon: MatchIcon,    count: null },
      { href: '/outreach',   label: 'Outreach',    icon: MailIcon,     count: null },
      { href: '/listings',   label: 'Listings',    icon: ListingIcon,  count: null },
      { href: '/copilot',    label: 'AI CFO',      icon: SparkIcon,    count: null },
      { href: '/news',       label: 'M&A News',    icon: NewsIcon,     count: null },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { href: '/profile',   label: 'Profile',   icon: PersonIcon,   count: null },
      { href: '/workspace', label: 'Workspace', icon: BuildingIcon, count: null },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname           = usePathname();
  const router             = useRouter();
  const { theme, toggle }  = useTheme();
  const [initials, setInitials]       = useState('U');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop]     = useState(true);
  const [lpModal, setLpModal]         = useState(false);
  const [lpForm, setLpForm]           = useState({ name: '', email: '', phone: '', company: '', ticket: '', message: '' });
  const [lpLoading, setLpLoading]     = useState(false);
  const [lpSuccess, setLpSuccess]     = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name = user.user_metadata?.full_name || user.email || '';
      const init = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
      setInitials(init || 'U');
    });
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { if (!isDesktop) setSidebarOpen(false); }, [pathname, isDesktop]);

  async function handleLogout() {
    await logoutRequest();
    router.push('/login');
  }

  function openWhatsApp(service: string) {
    const msg = encodeURIComponent(`Hi, I am interested in ONIX AI's ${service} service. Please guide me further.`);
    window.open(`https://wa.me/919940349156?text=${msg}`, '_blank');
  }

  async function handleLpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLpLoading(true);
    try {
      const supabase = createClient();
      await supabase.from('lp_applications').insert({
        full_name:     lpForm.name,
        email:         lpForm.email,
        phone:         lpForm.phone,
        company:       lpForm.company,
        ticket_size:   lpForm.ticket,
        message:       lpForm.message,
        created_at:    new Date().toISOString(),
      });
      setLpSuccess(true);
      // Also ping Robin on WhatsApp
      const msg = encodeURIComponent(`New LP Application from ${lpForm.name} (${lpForm.email}, ${lpForm.phone}). Ticket: ${lpForm.ticket}. Company: ${lpForm.company}. Message: ${lpForm.message}`);
      window.open(`https://wa.me/919940349156?text=${msg}`, '_blank');
    } catch {
      // Even if DB insert fails, still open WhatsApp
      const msg = encodeURIComponent(`New LP Application from ${lpForm.name} (${lpForm.email}). Ticket: ${lpForm.ticket}.`);
      window.open(`https://wa.me/919940349156?text=${msg}`, '_blank');
      setLpSuccess(true);
    } finally {
      setLpLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--onix-dark)', cursor: 'auto' }}>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 40,
          width: '220px',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          background: 'var(--onix-surface)',
          borderRight: '1px solid var(--onix-border)',
          transform: (isDesktop || sidebarOpen) ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px', flexShrink: 0, borderBottom: '1px solid var(--onix-border)' }}>
          <Image src="/logo.png" alt="ONIX AI" width={80} height={28} style={{ objectFit: 'contain' }} />
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 12px' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={{ padding: '0 12px', marginBottom: 8, marginTop: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--onix-muted)' }}>
                {section.label}
              </p>
              {section.items.map((item) => {
                const active   = pathname === item.href;
                const disabled = item.href === '#';
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 2,
                      fontSize: 14, fontWeight: 500, textDecoration: 'none',
                      color:         active ? 'var(--onix-gold)' : disabled ? 'var(--onix-border)' : 'var(--onix-muted)',
                      background:    active ? 'rgba(201,168,76,0.1)' : 'transparent',
                      cursor:        disabled ? 'not-allowed' : 'pointer',
                      pointerEvents: disabled ? 'none' : 'auto',
                      transition:    'background 0.15s, color 0.15s',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <item.icon size={16} />
                      {item.label}
                    </span>
                    {item.count !== null && (
                      <span style={{
                        fontSize: 11, padding: '2px 6px', borderRadius: 4,
                        background: active ? 'rgba(201,168,76,0.2)' : 'var(--onix-card)',
                        color:      active ? 'var(--onix-gold)' : 'var(--onix-muted)',
                      }}>
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Services — inside nav, scrolls with everything else */}
          <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 8, borderTop: '1px solid var(--onix-border)', marginTop: 8 }}>
            <p style={{ padding: '0 12px 6px', margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--onix-muted)' }}>
              SERVICES
            </p>
            {[
              { label: 'Investment Banking',    icon: BankIcon },
              { label: 'Wealth Management',     icon: WealthIcon },
              { label: 'Financial Advisory',    icon: AdvisoryIcon },
              { label: 'Capital Markets',       icon: CapitalIcon },
            ].map(svc => (
              <button key={svc.label} onClick={() => openWhatsApp(svc.label)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 2, fontSize: 14, fontWeight: 500, color: 'var(--onix-muted)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'color 0.15s, background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--onix-gold)'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--onix-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <svc.icon size={16} />
                {svc.label}
              </button>
            ))}
            <button onClick={() => { setLpModal(true); setLpSuccess(false); setLpForm({ name: '', email: '', phone: '', company: '', ticket: '', message: '' }); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, marginBottom: 2, fontSize: 14, fontWeight: 500, color: 'var(--onix-gold)', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', cursor: 'pointer', textAlign: 'left' }}
            >
              <PrivateEqIcon size={16} />
              <span style={{ lineHeight: 1.3 }}>Asset Management<br /><span style={{ fontSize: 10, fontWeight: 400, color: 'var(--onix-muted)' }}>Private Equity · Join as LP</span></span>
            </button>
          </div>
        </nav>

        {/* Sign out — pinned to bottom */}
        <div style={{ padding: '12px', flexShrink: 0, borderTop: '1px solid var(--onix-border)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: 'var(--onix-muted)', background: 'transparent', border: 'none',
              cursor: 'pointer', transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--onix-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogoutIcon size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', marginLeft: isDesktop ? '220px' : '0' }}>

        {/* Topbar */}
        <header
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', flexShrink: 0,
            background:   'var(--onix-surface)',
            borderBottom: '1px solid var(--onix-border)',
            height:       '64px',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-1"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <span className="block w-5 h-0.5" style={{ background: 'var(--onix-muted)' }} />
              <span className="block w-5 h-0.5" style={{ background: 'var(--onix-muted)' }} />
              <span className="block w-5 h-0.5" style={{ background: 'var(--onix-muted)' }} />
            </button>

            <div>
              <h1 className="text-sm md:text-base font-semibold capitalize" style={{ color: 'var(--onix-text)' }}>
                {pathname.replace('/', '') || 'Home'}
              </h1>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--onix-muted)' }}>
                ONIX AI Deal Room
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Consult M&A Advisor */}
            <a
              href="mailto:Robinkmr12@gmail.com?subject=M%26A Advisor Consultation&body=Hi%2C%20I%20would%20like%20to%20consult%20an%20M%26A%20advisor."
              title="Consult M&A Advisor"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, textDecoration: 'none',
                fontSize: 12, fontWeight: 600,
                background: 'linear-gradient(135deg,#C9A84C,#E8C96A)',
                color: '#0D0D0D', whiteSpace: 'nowrap',
              }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Consult M&amp;A Advisor
            </a>

            {/* Support */}
            <a
              href="mailto:Robinkmr12@gmail.com?subject=ONIX AI Support"
              title="Contact Support"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-muted)' }}
            >
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </a>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-muted)' }}
            >
              {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
            </button>

            {/* Avatar with dropdown */}
            <div style={{ position: 'relative' }} className="group">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer"
                style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
              >
                {initials}
              </div>
              {/* Dropdown — visible on hover */}
              <div
                className="group-hover:opacity-100 group-hover:pointer-events-auto"
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  minWidth: 160, borderRadius: 10, overflow: 'hidden',
                  background: 'var(--onix-surface)', border: '1px solid var(--onix-border)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                  opacity: 0, pointerEvents: 'none',
                  transition: 'opacity 0.15s',
                  zIndex: 100,
                }}
              >
                <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--onix-border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--onix-muted)', margin: 0 }}>Signed in as</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--onix-text)', margin: '2px 0 0' }}>{initials}</p>
                </div>
                <Link
                  href="/profile"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: 'var(--onix-muted)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--onix-card)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <PersonIcon size={14} /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444', background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogoutIcon size={14} /> Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>

      {/* ── LP Application Modal ── */}
      {lpModal && (
        <div onClick={() => setLpModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, borderRadius: 16, background: 'var(--onix-surface)', border: '1px solid var(--onix-border)', padding: 32, display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '90vh', overflowY: 'auto' }}>

            {lpSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ color: 'var(--onix-text)', margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Application Submitted!</h3>
                <p style={{ color: 'var(--onix-muted)', fontSize: 14, margin: '0 0 20px' }}>Robin will reach out to you on WhatsApp shortly.</p>
                <button onClick={() => setLpModal(false)} style={{ padding: '10px 28px', borderRadius: 8, background: 'var(--onix-gold)', color: '#0D0D0D', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <>
                <div>
                  <h3 style={{ color: 'var(--onix-gold)', margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>Asset Management · Private Equity</h3>
                  <p style={{ color: 'var(--onix-muted)', fontSize: 13, margin: 0 }}>Join as a Limited Partner — fill your details and we'll connect you directly.</p>
                </div>

                <form onSubmit={handleLpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { key: 'name',    label: 'Full Name *',              placeholder: 'John Doe',          type: 'text',  required: true },
                    { key: 'email',   label: 'Email *',                  placeholder: 'you@example.com',   type: 'email', required: true },
                    { key: 'phone',   label: 'Phone / WhatsApp *',       placeholder: '+91 98765 43210',   type: 'tel',   required: true },
                    { key: 'company', label: 'Company / Organisation',   placeholder: 'Acme Pvt Ltd',      type: 'text',  required: false },
                    { key: 'ticket',  label: 'Investment Ticket Size *', placeholder: '₹1Cr – ₹5Cr',      type: 'text',  required: true },
                  ].map(f => (
                    <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--onix-muted)' }}>{f.label}</label>
                      <input
                        type={f.type} required={f.required} placeholder={f.placeholder}
                        value={lpForm[f.key as keyof typeof lpForm]}
                        onChange={e => setLpForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ padding: '10px 12px', borderRadius: 8, fontSize: 14, background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)', outline: 'none' }}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--onix-muted)' }}>Message / Investment Goal</label>
                    <textarea rows={3} placeholder="Tell us about your investment objectives…"
                      value={lpForm.message}
                      onChange={e => setLpForm(p => ({ ...p, message: e.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: 8, fontSize: 14, background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button type="button" onClick={() => setLpModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-muted)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={lpLoading} style={{ flex: 2, padding: '11px', borderRadius: 8, background: 'linear-gradient(135deg,#C9A84C,#E8C96A)', color: '#0D0D0D', fontWeight: 700, fontSize: 14, border: 'none', cursor: lpLoading ? 'not-allowed' : 'pointer', opacity: lpLoading ? 0.7 : 1 }}>
                      {lpLoading ? 'Submitting…' : '🚀 Submit & Connect on WhatsApp'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Service icons ── */
function BankIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 22v-9m18 9V13M12 2 2 7h20L12 2zM3 13h18v-2H3v2z"/><line x1="12" y1="13" x2="12" y2="22"/><line x1="7" y1="13" x2="7" y2="22"/><line x1="17" y1="13" x2="17" y2="22"/></svg>;
}
function WealthIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}
function AdvisoryIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function CapitalIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
}
function PrivateEqIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;
}

/* ── Inline SVG icons ── */
function GridIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}
function FunnelIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
    </svg>
  );
}
function UsersIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
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
function NewsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
    </svg>
  );
}
function SparkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}
function PersonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function BuildingIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  );
}
function DealRoomIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <rect x="9" y="13" width="6" height="8"/>
    </svg>
  );
}
function MatchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="9" cy="12" r="4"/><circle cx="15" cy="12" r="4"/>
      <path d="M9 8V4M15 8V4M9 16v4M15 16v4"/>
    </svg>
  );
}
function ValuationIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  );
}
function CalcIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/>
      <line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/>
      <line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/>
    </svg>
  );
}
function ListingIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  );
}
function LogoutIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16,17 21,12 16,7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function SunIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}
function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}
