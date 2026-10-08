'use client';
import { useState } from 'react';
import Link from 'next/link';
import { send } from './ClientBits';
import { speak } from './ReadingPane';

const GRADES = [['Again', 0, 'danger'], ['Hard', 1, ''], ['Good', 2, 'primary'], ['Easy', 3, '']];

export default function Flashcards({ cards }) {
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const card = queue[0];

  async function grade(g) {
    send(`/api/vocab/${card.id}`, 'POST', { grade: g });
    const rest = queue.slice(1);
    // "Again" puts the card back a few places later in this session.
    if (g === 0) rest.splice(Math.min(3, rest.length), 0, card);
    else setDone(done + 1);
    setQueue(rest);
    setFlipped(false);
  }

  if (!card) {
    return (
      <div className="card center">
        <h2>{done ? `Great work! You reviewed ${done} ${done === 1 ? 'word' : 'words'} 🎉` : 'Nothing to review right now'}</h2>
        <p className="muted">Cards come back when it's time to practise them again.</p>
        <Link href="/articles" className="btn primary">Read another article</Link>
      </div>
    );
  }

  return (
    <div>
      <p className="muted center">{queue.length} left</p>
      <div className={'flash card' + (flipped ? ' flipped' : '')} onClick={() => setFlipped(true)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setFlipped(true)}>
        {!flipped ? (
          <>
            <h2>{card.word}</h2>
            <button className="btn small" onClick={(e) => { e.stopPropagation(); speak(card.word, 0.8); }}>🔊</button>
            <p className="muted small">Tap to reveal</p>
          </>
        ) : (
          <>
            <h3>{card.word}</h3>
            {card.definition && <p>{card.definition}</p>}
            {card.translation && <p className="tr">🌐 {card.translation}</p>}
            {card.example && <p className="muted">“{card.example}”</p>}
          </>
        )}
      </div>
      {flipped && (
        <div className="row center">
          {GRADES.map(([label, g, cls]) => (
            <button key={g} className={'btn ' + cls} onClick={() => grade(g)}>{label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
