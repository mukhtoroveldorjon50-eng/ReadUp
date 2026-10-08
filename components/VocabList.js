'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { send } from './ClientBits';
import { speak } from './ReadingPane';

const stop = (e) => e.stopPropagation();

export default function VocabList({ words }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [view, setView] = useState('check'); // 'check' = words only, tap to test yourself; 'list' = everything
  const [open, setOpen] = useState(null); // index into `shown`
  const [flipped, setFlipped] = useState(false);
  const [own, setOwn] = useState({}); // own sentences edited this session, by word id
  const [state, setState] = useState('');

  const shown = words.filter((w) => !q || w.word.includes(q.toLowerCase()) || w.definition.toLowerCase().includes(q.toLowerCase()));
  const current = open !== null ? shown[open] : null;
  const ownOf = (w) => (own[w.id] !== undefined ? own[w.id] : w.own_sentence || '');

  function openCard(i, showBack = false) {
    setOpen(i);
    setFlipped(showBack);
    setState('');
  }
  const move = (d) => open !== null && openCard((open + d + shown.length) % shown.length);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove(w) {
    if (!confirm(`Remove “${w.word}” from your vocabulary?`)) return;
    await send(`/api/vocab/${w.id}`, 'DELETE');
    setOpen(null);
    router.refresh();
  }

  async function saveOwn(w) {
    setState('saving');
    const res = await send(`/api/vocab/${w.id}`, 'PATCH', { own_sentence: ownOf(w) });
    setState(res.ok ? 'saved' : 'error');
    if (res.ok) router.refresh();
  }

  const status = (w) => (w.box >= 4 ? 'Learned' : w.due <= w.now ? 'Due' : `Box ${w.box}`);

  return (
    <>
      <div className="row between vocab-bar">
        <input className="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your words…" aria-label="Search words" />
        <div className="seg" role="group" aria-label="View">
          <button className={view === 'check' ? 'on' : ''} onClick={() => setView('check')}>Memory check</button>
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>Details</button>
        </div>
      </div>

      {view === 'check' && <p className="muted small">Tap a word and try to remember what it means. Tap the card again to check.</p>}

      {view === 'check' ? (
        <div className="tiles">
          {shown.map((w, i) => (
            <button key={w.id} className={'tile' + (w.box >= 4 ? ' learned' : w.due <= w.now ? ' due' : '')} onClick={() => openCard(i)}>
              {w.word}
            </button>
          ))}
        </div>
      ) : (
        <div className="vocab">
          {shown.map((w, i) => (
            <div className="card vw" key={w.id}>
              <div className="row between">
                <h3>{w.word}</h3>
                <div className="row">
                  <span className="chip" title="Flashcard box (0 new – 5 mastered)">{status(w)}</span>
                  <button className="btn small" onClick={() => speak(w.word, 0.8)} aria-label="Pronounce">🔊</button>
                  <button className="btn small" onClick={() => openCard(i, true)}>Open</button>
                </div>
              </div>
              {w.definition && <p>{w.definition}</p>}
              {w.translation && <p className="tr">🌐 {w.translation}</p>}
              {w.example && <p className="muted small">From the article: “{w.example}”</p>}
              {ownOf(w) && <p className="small">Your sentence: “{ownOf(w)}”</p>}
              {w.article_id && <p className="small"><Link href={`/articles/${w.article_id}`}>{w.article_title}</Link></p>}
            </div>
          ))}
        </div>
      )}
      {!shown.length && <p className="muted">No words match.</p>}

      {current && (
        <div className="overlay" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={`Flashcard for ${current.word}`}>
          <div className="overlay-inner" onClick={stop}>
            <div className="row between small muted">
              <span>{open + 1} / {shown.length} · {status(current)}</span>
              <button className="btn small ghost" onClick={() => setOpen(null)} aria-label="Close">✕ Close</button>
            </div>

            <div
              key={current.id + (flipped ? 'b' : 'f')}
              className={'flipcard card' + (flipped ? ' back' : '')}
              onClick={() => setFlipped(!flipped)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setFlipped(!flipped)}
              aria-label={flipped ? 'Card back. Tap to turn over' : 'Card front. Tap to reveal'}
            >
              {!flipped ? (
                <>
                  <h2>{current.word}</h2>
                  <button className="btn small" onClick={(e) => { stop(e); speak(current.word, 0.8); }} aria-label="Pronounce">🔊</button>
                  <p className="muted">Do you remember it?</p>
                  <p className="muted small">Tap the card to check</p>
                </>
              ) : (
                <div className="backface">
                  <h3>{current.word}</h3>
                  {current.definition ? <p>{current.definition}</p> : <p className="muted">No definition saved.</p>}
                  {current.translation && <p className="tr">🌐 {current.translation}</p>}
                  <div className="sent-box">
                    <span className="small muted">Sentence from the article</span>
                    <p>{current.example ? `“${current.example}”` : <span className="muted">None saved.</span>}</p>
                    {current.article_id && <p className="small"><Link href={`/articles/${current.article_id}`} onClick={stop}>{current.article_title}</Link></p>}
                  </div>
                  <div className="sent-box" onClick={stop}>
                    <span className="small muted">Your own sentence</span>
                    <textarea
                      rows={2}
                      maxLength={400}
                      value={ownOf(current)}
                      placeholder={`Write a sentence using “${current.word}”…`}
                      onChange={(e) => { setOwn({ ...own, [current.id]: e.target.value }); setState(''); }}
                    />
                    <div className="row">
                      <button className="btn small primary" disabled={state === 'saving'} onClick={() => saveOwn(current)}>Save my sentence</button>
                      {state === 'saved' && <span className="ok small">✓ Saved</span>}
                      {state === 'error' && <span className="error small">Could not save</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="row between">
              <button className="btn" onClick={() => move(-1)}>← Previous</button>
              <button className="btn small ghost" onClick={() => remove(current)}>Remove word</button>
              <button className="btn" onClick={() => move(1)}>Next →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
