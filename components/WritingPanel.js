'use client';
import { useState } from 'react';
import { send } from './ClientBits';

export default function WritingPanel({ articleId, last, aiEnabled }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [out, setOut] = useState(last ? { feedback: last.feedback, text: last.text } : null);

  async function submit() {
    setBusy(true);
    setError('');
    const { ok, data } = await send(`/api/articles/${articleId}/writing`, 'POST', { text });
    setBusy(false);
    if (!ok) return setError(data.error || 'Could not save.');
    setOut({ feedback: data.feedback, text });
    setText('');
  }

  return (
    <div className="card">
      <h2>Writing practice</h2>
      <p className="muted">Write 3–5 sentences: summarise the article, or say what you think about it. Try to use some of the new words.</p>
      <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Start writing here…" maxLength={3000} />
      <div className="row">
        <button className="btn primary" disabled={busy || text.trim().length < 20} onClick={submit}>
          {busy ? 'Checking…' : aiEnabled ? 'Get feedback' : 'Save my writing'}
        </button>
        {!aiEnabled && <span className="muted small">Automatic feedback is not switched on, so your text is only saved for you.</span>}
      </div>
      {error && <p className="error">{error}</p>}
      {out && (
        <div className="feedback">
          <p className="muted small">Your last text:</p>
          <p>{out.text}</p>
          {out.feedback && (<><p className="muted small">Feedback:</p><p className="pre">{out.feedback}</p></>)}
        </div>
      )}
    </div>
  );
}
