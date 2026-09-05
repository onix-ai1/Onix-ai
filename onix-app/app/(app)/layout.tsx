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
      { href: '/dashboard',   label: 'Dashboard',   icon: GridIcon,   count: null },
      { href: '/pipeline',    label: 'Pipeline',    icon: FunnelIcon, count: null },
      { href: '/calculator',  label: 'Calculator',  icon: CalcIcon,   count: null },
    ],
  },
  {
    label: 'NETWORK',
    items: [
      { href: '/investors',  label: 'Investors',   icon: UsersIcon,    count: null },
      { href: '/outreach',   label: 'Outreach',    icon: MailIcon,     count: null },
      { href: '/listings',   label: 'Listings',    icon: ListingIcon,  count: null },
      { href: '/copilot',    label: 'AI Co-Pilot', icon: SparkIcon,    count: null },
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
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleLogout() {
    await logoutRequest();
    router.push('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--onix-dark)', cursor: 'auto' }}>

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
        className={`
          fixed md:static inset-y-0 left-0 z-40
          flex flex-col flex-shrink-0
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          width: '220px',
          background: 'var(--onix-surface)',
          borderRight: '1px solid var(--onix-border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--onix-border)' }}>
          <Image src="/logo.png" alt="ONIX AI" width={80} height={28} style={{ objectFit: 'contain' }} />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto px-3 py-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-xs font-semibold tracking-widest" style={{ color: 'var(--onix-muted)' }}>
                {section.label}
              </p>
              {section.items.map((item) => {
                const active   = pathname === item.href;
                const disabled = item.href === '#';
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg mb-0.5 text-sm font-medium transition-all"
                    style={{
                      color:          active ? 'var(--onix-gold)' : disabled ? 'var(--onix-border)' : 'var(--onix-muted)',
                      background:     active ? 'rgba(201,168,76,0.1)' : 'transparent',
                      cursor:         disabled ? 'not-allowed' : 'pointer',
                      pointerEvents:  disabled ? 'none' : 'auto',
                    }}
                  >
                    <span className="flex items-center gap-2.5">
                      <item.icon size={16} />
                      {item.label}
                    </span>
                    {item.count !== null && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: active ? 'rgba(201,168,76,0.2)' : 'var(--onix-card)',
                          color:      active ? 'var(--onix-gold)' : 'var(--onix-muted)',
                        }}
                      >
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout — sticky to bottom so it never jumps during hydration */}
        <div className="px-3 py-4 sticky bottom-0" style={{ borderTop: '1px solid var(--onix-border)', background: 'var(--onix-surface)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
            style={{ color: 'var(--onix-muted)' }}
          >
            <LogoutIcon size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">

        {/* Topbar */}
        <header
          className="flex items-center justify-between px-4 md:px-6 py-4 flex-shrink-0"
          style={{
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
            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-muted)' }}
            >
              {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
            </button>

            {/* Avatar */}
            <Link href="/profile">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
                title="View profile"
              >
                {initials}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
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
