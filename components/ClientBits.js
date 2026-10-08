'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Remembers the browser's timezone so "today" and streaks follow the reader's own calendar. */
export function TzCookie() {
  useEffect(() => {
    const offset = -new Date().getTimezoneOffset();
    if (!document.cookie.split('; ').includes('tz=' + offset)) {
      document.cookie = `tz=${offset}; path=/; max-age=31536000; samesite=lax`;
    }
  }, []);
  return null;
}

/** Registers the service worker that makes visited articles readable offline. */
export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="linkbtn"
      onClick={async () => {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

/** Small helper: POST/PUT/DELETE JSON and return { ok, data }. */
export async function send(url, method = 'POST', body) {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: 'No connection. Please try again.' } };
  }
}
