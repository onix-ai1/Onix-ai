'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { loginRequest } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginRequest({ email, password });
      // First-time users go through onboarding; returning users go straight to dashboard
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const onboarded = user?.user_metadata?.onboarding_complete;
      router.push(onboarded ? '/dashboard' : '/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--onix-dark)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-10 flex flex-col gap-8"
        style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}
      >
        {/* Logo */}
        <div className="flex justify-center">
          <Image src="/logo.png" alt="ONIX AI" width={120} height={40} style={{ objectFit: 'contain' }} />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--onix-text)' }}>
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--onix-muted)' }}>
            Sign in to your deal room
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@onixai.co.in"
              className="rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'var(--onix-card)',
                border: '1px solid var(--onix-border)',
                color: 'var(--onix-text)',
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-3 pr-11 text-sm outline-none transition-all"
                style={{ background: 'var(--onix-card)', border: '1px solid var(--onix-border)', color: 'var(--onix-text)' }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--onix-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showPass ? (
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--onix-red)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg py-3 text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--onix-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--onix-gold)' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
