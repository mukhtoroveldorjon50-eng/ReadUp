'use client';
import { useEffect, useState } from 'react';

const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

export default function VocabPractice({ glossary }) {
  const withDef = glossary.filter((g) => g.definition);
  if (withDef.length < 3) {
    return (
      <div className="card">
        <h2>Practise the key words</h2>
        <p className="muted">This article does not have enough key vocabulary for exercises yet. Tap words in the text and save them to your vocabulary list instead.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="card">
        <h2>Practise the key words</h2>
        <p className="muted">Three short exercises built from this article's vocabulary.</p>
      </div>
      <Matching items={withDef.slice(0, 6)} />
      <FillGap items={withDef} />
      <OwnSentence items={withDef} />
    </div>
  );
}

function Matching({ items }) {
  const [defs, setDefs] = useState(items.map((g) => g.word));
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState([]);
  const [wrong, setWrong] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  useEffect(() => setDefs(shuffle(items.map((g) => g.word))), []); // eslint-disable-line react-hooks/exhaustive-deps
  const def = (w) => items.find((g) => g.word === w).definition;

  function pickDef(w) {
    if (!picked || done.includes(w)) return;
    if (picked === w) {
      setDone([...done, w]);
      setPicked(null);
    } else {
      setWrong(w);
      setMistakes(mistakes + 1);
      setTimeout(() => setWrong(null), 600);
    }
  }

  return (
    <div className="card">
      <h3>1. Match the word to its meaning</h3>
      <div className="match">
        <div>
          {items.map((g) => (
            <button key={g.word} disabled={done.includes(g.word)} className={'opt' + (picked === g.word ? ' pick' : '') + (done.includes(g.word) ? ' pick ok' : '')} onClick={() => setPicked(g.word)}>
              {g.word}
            </button>
          ))}
        </div>
        <div>
          {defs.map((w) => (
            <button key={w} disabled={done.includes(w)} className={'opt' + (done.includes(w) ? ' pick ok' : '') + (wrong === w ? ' pick no' : '')} onClick={() => pickDef(w)}>
              {def(w)}
            </button>
          ))}
        </div>
      </div>
      {done.length === items.length && <p className="ok"><b>All matched{mistakes ? ` (${mistakes} mistake${mistakes > 1 ? 's' : ''})` : ' with no mistakes'}! 🎉</b></p>}
      {done.length < items.length && <p className="muted small">Tap a word, then tap its meaning.</p>}
    </div>
  );
}

function FillGap({ items }) {
  const qs = items
    .filter((g) => g.example && new RegExp(`\\b${g.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(g.example))
    .map((g) => ({ word: g.word, text: g.example.replace(new RegExp(`\\b${g.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*`, 'i'), '____') }));
  const [vals, setVals] = useState({});
  const [checked, setChecked] = useState(false);
  const [bank, setBank] = useState(qs.map((q) => q.word));
  useEffect(() => setBank(shuffle(qs.map((q) => q.word))), []); // eslint-disable-line react-hooks/exhaustive-deps
  if (qs.length < 2) return null;
  const score = qs.filter((q, i) => vals[i] === q.word).length;
  return (
    <div className="card">
      <h3>2. Fill the gaps</h3>
      <p className="chips">{bank.map((w) => <span className="chip" key={w}>{w}</span>)}</p>
      {qs.map((q, i) => {
        const [a, b] = q.text.split('____');
        return (
          <p key={i} className="qtext">
            {a}
            <select className={'gap' + (checked ? (vals[i] === q.word ? ' ok' : ' no') : '')} value={vals[i] || ''} disabled={checked} onChange={(e) => setVals({ ...vals, [i]: e.target.value })}>
              <option value="">…</option>
              {bank.map((w) => <option key={w}>{w}</option>)}
            </select>
            {b}
          </p>
        );
      })}
      {!checked ? (
        <button className="btn small primary" onClick={() => setChecked(true)}>Check</button>
      ) : (
        <p><b>{score} / {qs.length}</b> <button className="btn small" onClick={() => { setChecked(false); setVals({}); }}>Try again</button></p>
      )}
    </div>
  );
}

function OwnSentence({ items }) {
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const [shown, setShown] = useState(false);
  const g = items[i];
  return (
    <div className="card">
      <h3>3. Use it in a sentence</h3>
      <p>Write your own sentence with <b>{g.word}</b> <span className="muted">({g.definition})</span></p>
      <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your sentence here…" />
      <div className="row">
        {g.example && <button className="btn small" onClick={() => setShown(true)}>Show an example</button>}
        <button className="btn small primary" onClick={() => { setI((i + 1) % items.length); setText(''); setShown(false); }}>Next word →</button>
      </div>
      {shown && <p className="muted">Example: {g.example}</p>}
    </div>
  );
}
