'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { speak } from './ReadingPane';

const words = (s) => (s.toLowerCase().replace(/[’]/g, "'").match(/[a-z0-9']+/g) || []);

// Longest-common-subsequence match, so one missed word doesn't misalign everything after it.
function compare(target, said) {
  const a = words(target);
  const b = words(said);
  const t = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const hit = Array(a.length).fill(false);
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { hit[i++] = true; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) i++;
    else j++;
  }
  return { words: a, hit, pct: a.length ? Math.round((hit.filter(Boolean).length / a.length) * 100) : 0 };
}

export default function SpeakingPractice({ body }) {
  const sentences = useMemo(
    () => (body.match(/[^]*?[.!?]+["”')\]]*(?=\s|$)/g) || []).map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => words(s).length >= 4 && words(s).length <= 30),
    [body]
  );
  const [i, setI] = useState(0);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [said, setSaid] = useState('');
  const [msg, setMsg] = useState('');
  const rec = useRef(null);

  useEffect(() => setSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)), []);
  useEffect(() => () => rec.current?.abort?.(), []);

  if (!sentences.length) return <div className="card"><p className="muted">This article has no sentences suitable for speaking practice.</p></div>;
  const target = sentences[i];
  const result = said ? compare(target, said) : null;

  function start() {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new R();
    r.lang = 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 1;
    setSaid('');
    setMsg('');
    r.onresult = (e) => setSaid(e.results[0][0].transcript);
    r.onerror = (e) => setMsg(e.error === 'not-allowed' ? 'Please allow microphone access in your browser.' : e.error === 'no-speech' ? "I didn't hear anything. Try again." : 'Speech recognition failed. Try again.');
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }

  return (
    <div className="card">
      <h2>Speaking practice</h2>
      <p className="muted">Listen, then read the sentence aloud. We'll show which words we heard.</p>
      <p className="speak-target">
        {result
          ? result.words.map((w, k) => <span key={k} className={result.hit[k] ? 'ok' : 'miss'}>{w} </span>)
          : target}
      </p>
      <div className="row">
        <button className="btn small" onClick={() => speak(target, 0.85)}>🔊 Listen</button>
        {supported ? (
          <button className="btn small primary" disabled={listening} onClick={start}>{listening ? '🎙 Listening…' : '🎙 Record'}</button>
        ) : (
          <span className="muted small">Recording needs Chrome, Edge or Safari.</span>
        )}
        <button className="btn small" onClick={() => { setI((i + 1) % sentences.length); setSaid(''); setMsg(''); }}>Next sentence →</button>
      </div>
      {msg && <p className="error">{msg}</p>}
      {result && (
        <p>
          <b>{result.pct}% matched.</b> {result.pct >= 85 ? 'Excellent! 🎉' : 'Red words were missed or sounded different. Listen again and retry.'}
          <br /><span className="muted small">We heard: “{said}”</span>
        </p>
      )}
    </div>
  );
}
