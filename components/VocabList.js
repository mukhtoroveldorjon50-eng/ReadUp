'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { send } from './ClientBits';
import { speak } from './ReadingPane';

export default function VocabList({ words }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const shown = words.filter((w) => !q || w.word.includes(q.toLowerCase()) || w.definition.toLowerCase().includes(q.toLowerCase()));

  async function remove(id) {
    if (!confirm('Remove this word from your vocabulary?')) return;
    await send(`/api/vocab/${id}`, 'DELETE');
    router.refresh();
  }

  return (
    <>
      <input className="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your words…" aria-label="Search words" />
      <div className="vocab">
        {shown.map((w) => (
          <div className="card vw" key={w.id}>
            <div className="row between">
              <h3>{w.word}</h3>
              <div className="row">
                <span className="chip" title="Flashcard box (0 new – 5 mastered)">{w.box >= 4 ? 'Learned' : w.due <= w.now ? 'Due' : `Box ${w.box}`}</span>
                <button className="btn small" onClick={() => speak(w.word, 0.8)} aria-label="Pronounce">🔊</button>
                <button className="btn small" onClick={() => remove(w.id)} aria-label="Remove">✕</button>
              </div>
            </div>
            {w.definition && <p>{w.definition}</p>}
            {w.translation && <p className="tr">🌐 {w.translation}</p>}
            {w.example && <p className="muted small">“{w.example}”</p>}
            {w.article_id && <p className="small"><Link href={`/articles/${w.article_id}`}>{w.article_title}</Link></p>}
          </div>
        ))}
        {!shown.length && <p className="muted">No words match.</p>}
      </div>
    </>
  );
}
