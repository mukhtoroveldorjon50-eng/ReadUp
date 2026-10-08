'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { send } from './ClientBits';

/** One small form that POSTs JSON, shows the error, and refreshes the page on success. */
function Inline({ url, method = 'POST', fields, button, onOk, children }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = Object.fromEntries(new FormData(e.target));
    const { ok, data } = await send(url, method, body);
    setBusy(false);
    if (!ok) return setError(data.error || 'Something went wrong.');
    onOk?.(data);
    e.target.reset();
    router.refresh();
  }
  return (
    <form className="inline-form" onSubmit={submit}>
      {fields}
      <button className="btn primary" disabled={busy}>{button}</button>
      {children}
      {error && <span className="error">{error}</span>}
    </form>
  );
}

export function AccountForm({ user, levels, langs }) {
  const [saved, setSaved] = useState(false);
  return (
    <Inline
      url="/api/account"
      method="PUT"
      button="Save settings"
      onOk={() => setSaved(true)}
      fields={
        <div className="stack">
          <label className="field">Name<input name="name" defaultValue={user.name} required /></label>
          {user.role === 'student' && (
            <>
              <label className="field">English level
                <select name="level" defaultValue={user.level}>{levels.map((l) => <option key={l}>{l}</option>)}</select>
              </label>
              <label className="field">Translate words into
                <select name="native_lang" defaultValue={user.native_lang}>{langs.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
              </label>
              <label className="field">Daily goal (XP)
                <input name="daily_goal" type="number" min="10" max="500" step="5" defaultValue={user.daily_goal} />
                <small className="muted">About 20 XP for finishing an article, plus XP for quizzes and flashcards.</small>
              </label>
            </>
          )}
        </div>
      }
    >
      {saved && <span className="ok">✓ Saved</span>}
    </Inline>
  );
}
