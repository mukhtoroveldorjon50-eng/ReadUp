'use client';
import { useState } from 'react';
import { send } from './ClientBits';

export default function AskAi({ articleId }) {
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  async function go(action, t = text) {
    setBusy(true);
    setAnswer('');
    const { ok, data } = await send('/api/ai', 'POST', { action, article_id: articleId, text: t });
    setBusy(false);
    setAnswer(ok ? data.answer : data.error || 'Something went wrong.');
  }

  return (
    <div className="card">
      <h2>Ask the AI helper</h2>
      <p className="muted">Get a quick summary, paste a sentence you don't understand, or ask a question about the article.</p>
      <div className="row">
        <button className="btn small" disabled={busy} onClick={() => go('summarize')}>Summarise the article</button>
      </div>
      <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a sentence, or type a question…" />
      <div className="row">
        <button className="btn small primary" disabled={busy || !text.trim()} onClick={() => go('explain')}>Explain this sentence</button>
        <button className="btn small" disabled={busy || !text.trim()} onClick={() => go('ask')}>Answer my question</button>
      </div>
      {busy && <p className="muted">Thinking…</p>}
      {answer && <div className="feedback"><p className="pre">{answer}</p></div>}
    </div>
  );
}
