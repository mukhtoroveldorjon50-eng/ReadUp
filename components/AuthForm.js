'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { send } from './ClientBits';

export default function AuthForm({ mode, levels }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const register = mode === 'register';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = Object.fromEntries(new FormData(e.target));
    const { ok, data } = await send(register ? '/api/register' : '/api/login', 'POST', f);
    if (!ok) {
      setError(data.error || 'Something went wrong.');
      setBusy(false);
      return;
    }
    router.push(data.role === 'teacher' ? '/teacher' : '/');
    router.refresh();
  }

  return (
    <form className="card auth" onSubmit={submit}>
      <h1>{register ? 'Create your account' : 'Welcome back'}</h1>
      {register && (
        <label className="field">
          Name
          <input name="name" required autoComplete="name" />
        </label>
      )}
      <label className="field">
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label className="field">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={register ? 8 : undefined}
          autoComplete={register ? 'new-password' : 'current-password'}
        />
        {register && <small className="muted">At least 8 characters.</small>}
      </label>
      {register && (
        <label className="field">
          Your English level
          <select name="level" defaultValue="B1">
            {levels.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <small className="muted">A2 = elementary, B1 = intermediate, B2 = upper-intermediate, C1 = advanced.</small>
        </label>
      )}
      {error && <p className="error">{error}</p>}
      <button className="btn primary" disabled={busy}>
        {register ? 'Sign up' : 'Sign in'}
      </button>
      <p className="muted center">
        {register ? (
          <>Already have an account? <Link href="/login">Sign in</Link></>
        ) : (
          <>New here? <Link href="/register">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
