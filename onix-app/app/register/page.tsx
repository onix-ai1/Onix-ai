'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { registerRequest } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      await registerRequest({ email, password, fullName });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : (typeof err === 'object' && err !== null && 'message' in err)
          ? String((err as { message: unknown }).message)
          : 'Registration failed. Please try again.';
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: 'var(--onix-card)',
    border: '1px solid var(--onix-border)',
    color: 'var(--onix-text)',
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12" style={{ background: 'var(--onix-dark)' }}>
      <div className="w-full max-w-md rounded-2xl p-10 flex flex-col gap-8"
        style={{ background: 'var(--onix-surface)', border: '1px solid var(--onix-border)' }}>

        <div className="flex justify-center">
          <Image src="/logo.png" alt="ONIX AI" width={120} height={40} style={{ objectFit: 'contain' }} />
        </div>

        {success ? (
          <div className="text-center flex flex-col gap-4">
            <div className="text-4xl">✓</div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--onix-green)' }}>Check your email</h1>
            <p className="text-sm" style={{ color: 'var(--onix-muted)' }}>
              We sent a confirmation link to <strong style={{ color: 'var(--onix-text)' }}>{email}</strong>.
              Click it to activate your account, then sign in.
            </p>
            <Link href="/login" className="mt-2 py-3 rounded-lg text-sm font-semibold text-center block"
              style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}>
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--onix-text)' }}>Create your account</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--onix-muted)' }}>Join the ONIX AI deal room</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Full Name</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Robin Kumar" className="rounded-lg px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@onixai.co.in" className="rounded-lg px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg px-4 py-3 pr-11 text-sm outline-none"
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--onix-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    tabIndex={-1}>
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--onix-muted)' }}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg px-4 py-3 pr-11 text-sm outline-none"
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--onix-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    tabIndex={-1}>
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-center" style={{ color: 'var(--onix-red)' }}>{error}</p>}

              <button type="submit" disabled={loading}
                className="rounded-lg py-3 text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: 'var(--onix-gold)', color: '#0D0D0D' }}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm" style={{ color: 'var(--onix-muted)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--onix-gold)' }}>Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
