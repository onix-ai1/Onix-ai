import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED = ['/dashboard', '/pipeline', '/investors', '/outreach', '/copilot', '/workspace', '/profile', '/onboarding'];
const PUBLIC_AUTH = ['/login', '/register'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // Create Supabase client that can read/write cookies in middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isPublicAuth = PUBLIC_AUTH.some((p) => pathname.startsWith(p));

  // Not logged in → redirect to /login
  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Already logged in → skip /login and /register
  if (isPublicAuth && session) {
    const url = req.nextUrl.clone();
    const onboarded = session.user?.user_metadata?.onboarding_complete;
    url.pathname = onboarded ? '/dashboard' : '/onboarding';
    return NextResponse.redirect(url);
  }

  // Already onboarded → skip /onboarding
  if (pathname.startsWith('/onboarding') && session) {
    const onboarded = session.user?.user_metadata?.onboarding_complete;
    if (onboarded) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*', '/pipeline/:path*', '/investors/:path*',
    '/outreach/:path*', '/copilot/:path*', '/workspace/:path*',
    '/profile/:path*', '/onboarding/:path*', '/onboarding',
    '/login', '/register',
  ],
};
