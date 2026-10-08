'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { send } from './ClientBits';

// Sentences end at . ! ? (plus closing quotes) followed by whitespace, so "3.5" stays in one piece.
function splitSentences(par) {
  return (par.match(/[^]*?[.!?]+["”')\]]*(?=\s|$)|[^]+$/g) || [par]).map((s) => s.trim()).filter(Boolean);
}

function buildText(body) {
  let n = 0;
  return body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
    .map((p) => splitSentences(p).map((text) => ({ i: n++, text, tokens: text.split(/([A-Za-z][A-Za-z'’-]*)/) })));
}

// Candidate base forms, so "studies" finds "study" and "walked" finds "walk".
function forms(w) {
  const out = [w];
  if (w.endsWith('ies')) out.push(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) out.push(w.slice(0, -2));
  if (w.endsWith('s')) out.push(w.slice(0, -1));
  if (w.endsWith('ed')) out.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith('ing')) out.push(w.slice(0, -3), w.slice(0, -3) + 'e');
  if (w.endsWith('ly')) out.push(w.slice(0, -2));
  return [...new Set(out)].filter((x) => x.length > 2 || x === w);
}

const norm = (w) => w.toLowerCase().replace(/[’]/g, "'").replace(/^['-]+|['-]+$/g, '');

export function speak(text, rate = 0.9) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

export default function ReadingPane({
  article, glossary, saved, onSave, bookmarked: bm0, finished: fin0, active, nativeLang, aiEnabled, onGoto, next,
}) {
  const [mode, setMode] = useState('original');
  const [size, setSize] = useState(1);
  const [bookmarked, setBookmarked] = useState(bm0);
  const [popup, setPopup] = useState(null);
  const [speaking, setSpeaking] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(0.9);
  const [result, setResult] = useState(fin0);
  const [, tick] = useState(0);
  const secs = useRef(0);
  const audioRef = useRef(null);
  const run = useRef(0); // bumps on every stop, so late "end" events are ignored
  const rateRef = useRef(rate);
  rateRef.current = rate;

  const text = mode === 'simple' && article.bodySimple ? article.bodySimple : article.body;
  const paragraphs = useMemo(() => buildText(text), [text]);
  const sentences = useMemo(() => paragraphs.flat(), [paragraphs]);
  const glossMap = useMemo(() => new Map(glossary.map((g) => [norm(g.word), g])), [glossary]);
  const savedSet = useMemo(() => new Set(saved), [saved]);
  const [canSpeak, setCanSpeak] = useState(false);
  useEffect(() => setCanSpeak('speechSynthesis' in window), []);

  // Reading timer: counts only while this tab is showing and the page is visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (active && !result && document.visibilityState === 'visible') {
        secs.current++;
        tick((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [active, result]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => { if (!active) stopSpeech(); }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopSpeech() {
    run.current++;
    window.speechSynthesis?.cancel();
    setSpeaking(-1);
    setPlaying(false);
    setPaused(false);
  }

  function speakFrom(start) {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const id = ++run.current;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => /^en[-_](US|GB)/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang));
    setPlaying(true);
    setPaused(false);
    const step = (i) => {
      if (id !== run.current) return;
      if (i >= sentences.length) return stopSpeech();
      const u = new SpeechSynthesisUtterance(sentences[i].text);
      u.lang = 'en-US';
      if (voice) u.voice = voice;
      u.rate = rateRef.current;
      u.onend = () => step(i + 1);
      u.onerror = () => { if (id === run.current) stopSpeech(); };
      setSpeaking(i);
      document.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      window.speechSynthesis.speak(u);
    };
    step(start);
  }

  function togglePause() {
    if (paused) window.speechSynthesis.resume();
    else window.speechSynthesis.pause();
    setPaused(!paused);
  }

  function onTextClick(e) {
    const w = e.target.closest?.('.w');
    if (!w) return setPopup(null);
    const sent = sentences[Number(w.closest('.sent')?.dataset.i)];
    setPopup({ word: w.textContent, sentence: sent?.text || '', i: sent?.i ?? 0 });
  }

  async function finish() {
    const { ok, data } = await send(`/api/articles/${article.id}/finish`, 'POST', { seconds: secs.current, mode });
    if (ok) setResult({ wpm: data.wpm, seconds: data.seconds, xp: data.xp });
  }

  async function toggleBookmark() {
    const { ok, data } = await send(`/api/articles/${article.id}/bookmark`);
    if (ok) setBookmarked(data.bookmarked);
  }

  const mm = Math.floor(secs.current / 60);
  const ss = String(secs.current % 60).padStart(2, '0');

  return (
    <div>
      <div className="toolbar card">
        {canSpeak && (
          <div className="row">
            {!playing ? (
              <button className="btn small primary" onClick={() => speakFrom(0)}>▶ Listen</button>
            ) : (
              <>
                <button className="btn small" onClick={togglePause}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
                <button className="btn small" onClick={stopSpeech}>■ Stop</button>
              </>
            )}
            <select value={rate} onChange={(e) => setRate(Number(e.target.value))} aria-label="Speed">
              <option value={0.7}>Slow</option>
              <option value={0.9}>Normal</option>
              <option value={1.15}>Fast</option>
            </select>
          </div>
        )}
        {article.bodySimple && (
          <div className="seg" role="group" aria-label="Version">
            {['original', 'simple'].map((m) => (
              <button key={m} className={mode === m ? 'on' : ''} onClick={() => { stopSpeech(); setMode(m); }}>
                {m === 'original' ? 'Original' : 'Simplified'}
              </button>
            ))}
          </div>
        )}
        <div className="row">
          <button className="btn small" onClick={() => setSize(Math.max(0, size - 1))} aria-label="Smaller text">A−</button>
          <button className="btn small" onClick={() => setSize(Math.min(3, size + 1))} aria-label="Larger text">A+</button>
          <button className={'btn small' + (bookmarked ? ' primary' : '')} onClick={toggleBookmark}>
            {bookmarked ? '★ Saved' : '☆ Save'}
          </button>
        </div>
        <span className="muted small timer">⏱ {mm}:{ss}</span>
      </div>

      {article.audioUrl && (
        <div className="card audio">
          <b>Audio recording</b>
          <audio ref={audioRef} controls preload="none" src={article.audioUrl} />
          <select aria-label="Audio speed" defaultValue="1" onChange={(e) => (audioRef.current.playbackRate = Number(e.target.value))}>
            <option value="0.75">0.75×</option>
            <option value="1">1×</option>
            <option value="1.25">1.25×</option>
          </select>
        </div>
      )}

      <article className={'prose s' + size} onClick={onTextClick}>
        {paragraphs.map((sents, pi) => (
          <p key={pi}>
            {sents.map((s) => (
              <span key={s.i} data-i={s.i} className={'sent' + (speaking === s.i ? ' speaking' : '')}>
                {s.tokens.map((t, ti) => {
                  if (ti % 2 === 0) return t;
                  const k = norm(t);
                  const cls = 'w' + (savedSet.has(k) ? ' saved' : '') + (glossMap.has(k) ? ' gl' : '');
                  return <span key={ti} className={cls}>{t}</span>;
                })}{' '}
              </span>
            ))}
          </p>
        ))}
      </article>
      <p className="muted small hint">Tap any word to see what it means. Underlined words are key vocabulary.</p>

      {popup && (
        <WordPopup
          key={popup.word + popup.i}
          popup={popup}
          glossMap={glossMap}
          savedSet={savedSet}
          nativeLang={nativeLang}
          articleId={article.id}
          onSave={onSave}
          onClose={() => setPopup(null)}
          onReadSentence={() => { setPopup(null); speakFrom(popup.i); }}
          canSpeak={canSpeak}
        />
      )}

      <div className="card finish">
        {result ? (
          <>
            <h3>✓ Finished!</h3>
            <p>
              You read {article.wordCount} words in {Math.floor(result.seconds / 60)}:{String(result.seconds % 60).padStart(2, '0')} —
              about <b>{result.wpm} words per minute</b>.
              {result.xp ? ` +${result.xp} XP.` : ''}
            </p>
            <p className="muted small">Adult native readers read about 240 words per minute. For IELTS, aim for 200+.</p>
            <div className="row">
              <button className="btn primary" onClick={() => onGoto('lang')}>Take the language quiz</button>
              <button className="btn" onClick={() => onGoto('comp')}>Take the comprehension quiz</button>
              {next && <a className="btn ghost" href={`/articles/${next.id}`}>Next: {next.title} →</a>}
            </div>
          </>
        ) : (
          <>
            <p>Done reading? Mark it finished to log your reading speed and earn XP.</p>
            <button className="btn primary" onClick={finish}>I finished reading</button>
          </>
        )}
      </div>
    </div>
  );
}

function WordPopup({ popup, glossMap, savedSet, nativeLang, articleId, onSave, onClose, onReadSentence, canSpeak }) {
  const key = norm(popup.word);
  const gloss = forms(key).map((f) => glossMap.get(f)).find(Boolean);
  const [dict, setDict] = useState(null); // null = loading
  const [tr, setTr] = useState(gloss?.translation || '');
  const [sentTr, setSentTr] = useState('');
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [mine, setMine] = useState('');
  const [mineState, setMineState] = useState('');
  const headword = gloss ? norm(gloss.word) : key;
  const isSaved = savedSet.has(headword) || savedSet.has(key) || justSaved;

  useEffect(() => {
    let live = true;
    if (savedSet.has(headword) || savedSet.has(key)) {
      fetch('/api/vocab?word=' + encodeURIComponent(savedSet.has(headword) ? headword : key))
        .then((r) => r.json())
        .then((d) => { if (live && d.saved) { setSavedId(d.id); setMine(d.own_sentence || ''); } })
        .catch(() => {});
    }
    (async () => {
      let found = { found: false };
      for (const f of forms(key).slice(0, 3)) {
        try {
          const r = await fetch('/api/define?word=' + encodeURIComponent(f));
          const d = await r.json();
          if (d.found || d.offline) { found = d; if (d.found) found.base = f; break; }
        } catch { found = { found: false, offline: true }; break; }
      }
      if (live) setDict(found);
    })();
    if (nativeLang && !gloss?.translation) {
      fetch(`/api/translate?text=${encodeURIComponent(headword)}&to=${nativeLang}`)
        .then((r) => r.json())
        .then((d) => live && setTr(d.translation || ''))
        .catch(() => {});
    }
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function translateSentence() {
    setSentTr('…');
    const r = await fetch(`/api/translate?text=${encodeURIComponent(popup.sentence)}&to=${nativeLang}`).then((x) => x.json()).catch(() => ({}));
    setSentTr(r.translation || 'Translation is not available right now.');
  }

  async function save() {
    setBusy(true);
    const m = dict?.meanings?.[0];
    const { ok, data } = await send('/api/vocab', 'POST', {
      word: headword,
      definition: gloss?.definition || m?.definition || '',
      translation: tr,
      example: popup.sentence, // the sentence this word came from
      article_id: articleId,
    });
    setBusy(false);
    if (ok) { setJustSaved(true); setSavedId(data.id); onSave(headword); }
  }

  async function saveMine() {
    setMineState('saving');
    const res = await send(`/api/vocab/${savedId}`, 'PATCH', { own_sentence: mine });
    setMineState(res.ok ? 'saved' : 'error');
  }

  return (
    <div className="popup card" role="dialog" aria-label={`Meaning of ${popup.word}`}>
      <button className="x" onClick={onClose} aria-label="Close">×</button>
      <div className="row">
        <h3>{popup.word}</h3>
        {dict?.phonetic && <span className="muted">{dict.phonetic}</span>}
        {canSpeak && <button className="btn small" onClick={() => speak(popup.word, 0.8)} aria-label="Pronounce">🔊</button>}
      </div>
      {gloss?.definition && <p><b>{gloss.definition}</b></p>}
      {dict === null && !gloss?.definition && <p className="muted">Looking up…</p>}
      {dict?.meanings?.map((m, i) => (
        <p key={i}><i className="muted">{m.pos}</i> {m.definition}{m.example && <span className="muted"> — “{m.example}”</span>}</p>
      ))}
      {dict && !dict.found && !gloss?.definition && (
        <p className="muted">{dict.offline ? 'The dictionary is not reachable right now.' : 'No definition found for this word.'}</p>
      )}
      {tr && <p className="tr">🌐 {tr}</p>}
      <div className="row">
        <button className="btn small primary" disabled={isSaved || busy} onClick={save}>
          {isSaved ? '✓ In your vocabulary' : '+ Save word'}
        </button>
        {canSpeak && <button className="btn small" onClick={onReadSentence}>▶ Read from here</button>}
        {nativeLang && <button className="btn small" onClick={translateSentence}>Translate sentence</button>}
      </div>
      {sentTr && <p className="tr small">{sentTr}</p>}
      {isSaved && savedId && (
        <div className="own">
          <label className="small muted">Your own sentence with “{headword}”</label>
          <textarea rows={2} value={mine} maxLength={400} onChange={(e) => { setMine(e.target.value); setMineState(''); }} placeholder={`Write a sentence using ${headword}…`} />
          <div className="row">
            <button className="btn small primary" disabled={mineState === 'saving'} onClick={saveMine}>Save my sentence</button>
            {mineState === 'saved' && <span className="ok small">✓ Saved</span>}
            {mineState === 'error' && <span className="error small">Could not save</span>}
          </div>
        </div>
      )}
    </div>
  );
}
