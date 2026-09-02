import { createClient } from './supabase/client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
}

/* ── Supabase Auth ── */

export async function loginRequest(credentials: LoginCredentials) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function registerRequest(credentials: RegisterCredentials) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: { full_name: credentials.fullName },
    },
  });
  if (error) {
    const msg = error.message
      ? error.message
      : error.status === 500
        ? 'Server error from Supabase. Please check your Supabase project email settings or try again shortly.'
        : 'Registration failed. Please try again.';
    throw new Error(msg);
  }
  return data;
}

export async function logoutRequest() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/* ── API fetch (backend REST API, Bearer token from Supabase session) ── */
export async function apiFetch(path: string, init?: RequestInit) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
}
