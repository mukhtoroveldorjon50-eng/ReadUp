'use client';
import { useState } from 'react';
import { send } from './ClientBits';

const TFNG = ['True', 'False', 'Not given'];

export default function QuizPanel({ articleId, kind, heading, blurb, questions, best: best0 }) {
  const n = questions.length;
  const [answers, setAnswers] = useState(() => Array(n).fill(''));
  const [checks, setChecks] = useState(() => Array(n).fill(null));
  const [summary, setSummary] = useState(null);
  const [best, setBest] = useState(best0);
  const [error, setError] = useState('');

  if (!n) {
    return (
      <div className="card">
        <h2>{heading}</h2>
        <p className="muted">This article has no {kind === 'lang' ? 'language' : 'comprehension'} quiz yet.</p>
      </div>
    );
  }

  const done = checks.filter(Boolean).length;

  async function check(i, value) {
    if (checks[i]) return;
    setError('');
    const a = [...answers];
    a[i] = value;
    setAnswers(a);
    const { ok, data } = await send(`/api/articles/${articleId}/quiz/${kind}`, 'POST', { index: i, answer: value });
    if (!ok) return setError(data.error || 'Could not check that answer.');
    const c = [...checks];
    c[i] = data;
    setChecks(c);
    if (c.every(Boolean)) {
      const res = await send(`/api/articles/${articleId}/quiz/${kind}`, 'POST', { answers: a });
      if (res.ok) {
        setSummary(res.data);
        setBest((b) => (!b || res.data.score > b.score ? { score: res.data.score, max: res.data.max } : b));
      }
    }
  }

  function retry() {
    setAnswers(Array(n).fill(''));
    setChecks(Array(n).fill(null));
    setSummary(null);
    setError('');
  }

  return (
    <div>
      <div className="card">
        <div className="row between">
          <h2>{heading}</h2>
          {best && <span className="chip">Best: {best.score}/{best.max}</span>}
        </div>
        <p className="muted">{blurb}</p>
        <div className="bar"><i style={{ width: (done / n) * 100 + '%' }} /></div>
        <p className="muted small">{done} of {n} answered</p>
      </div>

      {questions.map((q, i) => {
        const c = checks[i];
        return (
          <div key={i} className={'card q' + (c ? (c.correct ? ' right' : ' wrong') : '')}>
            <p className="qtext">
              <b>{i + 1}.</b>{' '}
              {q.type === 'gap' ? <GapText q={q} i={i} value={answers[i]} check={c} onChange={(v) => setAnswers(answers.map((x, j) => (j === i ? v : x)))} onCheck={() => check(i, answers[i])} /> : q.q}
            </p>
            {q.type === 'mcq' && (
              <div className="opts">
                {q.options.map((o, oi) => (
                  <button
                    key={oi}
                    disabled={Boolean(c)}
                    className={'opt' + (c && String(answers[i]) === String(oi) ? (c.correct ? ' pick ok' : ' pick no') : '') + (c && !c.correct && c.answer === o ? ' reveal' : '')}
                    onClick={() => check(i, oi)}
                  >
                    <span className="letter">{'ABCDEFGH'[oi]}</span> {o}
                  </button>
                ))}
              </div>
            )}
            {q.type === 'tfng' && (
              <div className="opts inline">
                {TFNG.map((o) => (
                  <button
                    key={o}
                    disabled={Boolean(c)}
                    className={'opt' + (c && answers[i] === o ? (c.correct ? ' pick ok' : ' pick no') : '') + (c && !c.correct && c.answer === o ? ' reveal' : '')}
                    onClick={() => check(i, o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}
            {q.type === 'gap' && !c && (
              <button className="btn small" disabled={!answers[i].trim()} onClick={() => check(i, answers[i])}>Check</button>
            )}
            {c && (
              <div className="feedback">
                <b>{c.correct ? '✓ Correct!' : `✗ Not quite. The answer is: ${c.answer}`}</b>
                {c.explanation && <p>{c.explanation}</p>}
              </div>
            )}
          </div>
        );
      })}

      {error && <p className="error">{error}</p>}
      {summary && (
        <div className="card result">
          <h3>You scored {summary.score} / {summary.max}</h3>
          <div className="bar"><i style={{ width: (summary.score / summary.max) * 100 + '%' }} /></div>
          <p>
            {summary.score === summary.max ? 'Perfect! 🎉' : summary.score / summary.max >= 0.7 ? 'Well done!' : 'Good effort. Read the explanations above, then try again.'}
            {summary.xp ? ` +${summary.xp} XP` : ''}
          </p>
          <button className="btn" onClick={retry}>Try again</button>
        </div>
      )}
    </div>
  );
}

function GapText({ q, value, check, onChange, onCheck }) {
  const parts = q.q.split('____');
  return (
    <>
      {parts[0]}
      <input
        className={'gap' + (check ? (check.correct ? ' ok' : ' no') : '')}
        value={value}
        disabled={Boolean(check)}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && value.trim() && onCheck()}
        aria-label="Your answer"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      {parts.slice(1).join('____')}
    </>
  );
}
