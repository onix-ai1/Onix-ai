'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/lib/theme';
import { createClient } from '@/lib/supabase/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthRefreshWatcher queryClient={queryClient} />
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

/* ── Supabase session auto-refresh watcher ── */
function AuthRefreshWatcher({ queryClient }: { queryClient: QueryClient }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const PROTECTED_PREFIXES = [
      '/dashboard', '/pipeline', '/investors', '/outreach',
      '/copilot', '/workspace', '/profile', '/onboarding',
    ];

    function isProtected() {
      return PROTECTED_PREFIXES.some(p => window.location.pathname.startsWith(p));
    }

    // Verify the user still exists on the server (catches deleted accounts)
    // Only relevant when we're inside the app — not on public pages
    supabase.auth.getUser().then(({ error }) => {
      if (error && isProtected()) {
        queryClient.clear();
        supabase.auth.signOut();
        router.push('/login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.debug('[auth] token refreshed');
      }

      // Only force-redirect on protected pages — public pages are fine without a session
      if ((event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) && isProtected()) {
        queryClient.clear();
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, router]);

  return null;
}
