'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { send } from './ClientBits';

const blankQ = (type) =>
  type === 'mcq' ? { type, q: '', options: ['', '', '', ''], answer: 0, explanation: '' }
  : type === 'tfng' || type === 'tf' ? { type, q: '', answer: 'True', explanation: '' }
  : { type, q: '', answer: '', explanation: '' };

export default function ArticleEditor({ article, levels, topics, aiEnabled, groupId = null, takenLevels = [], defaults = {} }) {
  const router = useRouter();
  const editing = Boolean(article?.id);
  const [f, setF] = useState({
    title: article?.title ?? '', level: article?.level ?? levels.find((l) => !takenLevels.includes(l)) ?? 'B1', topic: article?.topic ?? defaults.topic ?? '', summary: article?.summary ?? '',
    body: article?.body ?? '', body_simple: article?.body_simple ?? '', writing_prompt: article?.writing_prompt ?? '', published: article?.published ?? true,
  });
  const [glossary, setGlossary] = useState(article?.glossary ?? []);
  const [lang, setLang] = useState(article?.lang_quiz ?? []);
  const [comp, setComp] = useState(article?.comp_quiz ?? []);
  const [audio, setAudio] = useState(null);
  const [hasAudio, setHasAudio] = useState(Boolean(article?.has_audio));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function uploadAudio(id) {
    if (!audio) return true;
    const fd = new FormData();
    fd.append('file', audio);
    const res = await fetch(`/api/articles/${id}/audio`, { method: 'POST', body: fd });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error || 'The audio could not be uploaded.');
      return false;
    }
    return true;
  }

  async function save() {
    setBusy('save');
    setError('');
    const payload = { ...f, glossary, lang_quiz: lang, comp_quiz: comp, ...(editing ? {} : { group_id: groupId }) };
    const { ok, data } = editing
      ? await send(`/api/articles/${article.id}`, 'PUT', payload)
      : await send('/api/articles', 'POST', payload);
    if (!ok) { setBusy(''); return setError(data.error || 'Could not save.'); }
    const id = editing ? article.id : data.id;
    if (!(await uploadAudio(id))) {
      setBusy('');
      if (!editing) router.replace(`/teacher/articles/${id}`);
      return;
    }
    router.push('/teacher');
    router.refresh();
  }

  async function removeAudio() {
    await send(`/api/articles/${article.id}/audio`, 'DELETE');
    setHasAudio(false);
  }

  async function remove() {
    if (!confirm('Delete this article and everything attached to it? This cannot be undone.')) return;
    await send(`/api/articles/${article.id}`, 'DELETE');
    router.push('/teacher');
    router.refresh();
  }

  async function draft() {
    if ((glossary.length || lang.length || comp.length) && !confirm('This adds AI-drafted vocabulary and questions to what you already have. Continue?')) return;
    setBusy('ai');
    setError('');
    const { ok, data } = await send('/api/ai/draft-quiz', 'POST', { body: f.body, level: f.level });
    setBusy('');
    if (!ok) return setError(data.error || 'Drafting failed.');
    const d = data.draft || {};
    setGlossary([...glossary, ...(d.glossary || [])]);
    setLang([...lang, ...(d.lang_quiz || [])]);
    setComp([...comp, ...(d.comp_quiz || [])]);
  }

  return (
    <div className="editor">
      <div className="card">
        <label className="field">Title<input value={f.title} onChange={set('title')} maxLength={200} /></label>
        <div className="three">
          <label className="field">Level
            <select value={f.level} onChange={set('level')}>{levels.map((l) => <option key={l} disabled={takenLevels.includes(l)}>{l}{takenLevels.includes(l) ? ' (already exists)' : ''}</option>)}</select>
          </label>
          <label className="field">Topic
            <input list="topics" value={f.topic} onChange={set('topic')} placeholder="Science, Culture…" />
            <datalist id="topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
          </label>
          <label className="field check"><input type="checkbox" checked={f.published} onChange={set('published')} /> Published (visible to students)</label>
        </div>
        <label className="field">Short summary <small className="muted">(shown on the article card)</small>
          <input value={f.summary} onChange={set('summary')} maxLength={400} />
        </label>
        <label className="field">Article text <small className="muted">(leave a blank line between paragraphs; start a line with ## to make a heading)</small>
          <textarea rows={14} value={f.body} onChange={set('body')} />
        </label>
        <label className="field">Simplified version <small className="muted">(optional, an easier rewrite of the same article)</small>
          <textarea rows={8} value={f.body_simple} onChange={set('body_simple')} />
        </label>
        <label className="field">Writing task <small className="muted">(optional, shown in the Writing tab; the key vocabulary words are ticked off as readers use them)</small>
          <textarea rows={4} value={f.writing_prompt} onChange={set('writing_prompt')} />
        </label>
        <div className="field">
          Audio recording <small className="muted">(optional mp3/m4a/wav, up to 30 MB; without it students can still use text-to-speech)</small>
          {hasAudio && !audio && <p className="row">🎧 An audio file is attached. <button type="button" className="btn small" onClick={removeAudio}>Remove</button></p>}
          <input type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg" onChange={(e) => setAudio(e.target.files[0] || null)} />
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <h2>Key vocabulary</h2>
          <div className="row">
            {aiEnabled && <button type="button" className="btn small" disabled={busy === 'ai'} onClick={draft}>{busy === 'ai' ? 'Drafting…' : '✨ Draft vocabulary & quizzes with AI'}</button>}
            <button type="button" className="btn small" onClick={() => setGlossary([...glossary, { word: '', definition: '', translation: '', example: '' }])}>+ Add word</button>
          </div>
        </div>
        <p className="muted small">These words are underlined for students, and they power the word exercises. The example should contain the word.</p>
        {glossary.map((g, i) => (
          <div className="glossrow" key={i}>
            <input placeholder="Word" value={g.word} onChange={(e) => setGlossary(glossary.map((x, j) => (j === i ? { ...x, word: e.target.value } : x)))} />
            <input placeholder="Simple definition" value={g.definition} onChange={(e) => setGlossary(glossary.map((x, j) => (j === i ? { ...x, definition: e.target.value } : x)))} />
            <input placeholder="Example sentence" value={g.example} onChange={(e) => setGlossary(glossary.map((x, j) => (j === i ? { ...x, example: e.target.value } : x)))} />
            <input placeholder="Translation (optional)" value={g.translation} onChange={(e) => setGlossary(glossary.map((x, j) => (j === i ? { ...x, translation: e.target.value } : x)))} />
            <button type="button" className="btn small" onClick={() => setGlossary(glossary.filter((_, j) => j !== i))} aria-label="Remove word">✕</button>
          </div>
        ))}
      </div>

      <QuizEditor title="Language quiz" hint="Grammar and vocabulary: tenses, word forms, collocations, meanings in context." list={lang} setList={setLang} />
      <QuizEditor title="Comprehension quiz" hint="Understanding the content: main idea, details, True / False / Not given, inference." list={comp} setList={setComp} />

      {error && <p className="error">{error}</p>}
      <div className="row stickybar">
        <button className="btn primary" disabled={busy === 'save'} onClick={save}>{busy === 'save' ? 'Saving…' : editing ? 'Save changes' : 'Create article'}</button>
        <button className="btn ghost" onClick={() => router.push('/teacher')}>Cancel</button>
        {editing && <button className="btn danger" onClick={remove}>Delete article</button>}
      </div>
    </div>
  );
}

function QuizEditor({ title, hint, list, setList }) {
  const upd = (i, patch) => setList(list.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  return (
    <div className="card">
      <div className="row between">
        <h2>{title} <span className="muted small">({list.length} questions)</span></h2>
        <div className="row">
          {['mcq', 'tfng', 'tf', 'gap'].map((t) => (
            <button key={t} type="button" className="btn small" onClick={() => setList([...list, blankQ(t)])}>
              + {t === 'mcq' ? 'Multiple choice' : t === 'tfng' ? 'True/False/NG' : t === 'tf' ? 'True/False' : 'Gap fill'}
            </button>
          ))}
        </div>
      </div>
      <p className="muted small">{hint}</p>
      {list.map((q, i) => (
        <div className="qedit" key={i}>
          <div className="row between">
            <b>{i + 1}. {q.type === 'mcq' ? 'Multiple choice' : q.type === 'tfng' ? 'True / False / Not given' : q.type === 'tf' ? 'True / False' : 'Gap fill'}</b>
            <div className="row">
              <button type="button" className="btn small" disabled={i === 0} onClick={() => { const a = [...list]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setList(a); }} aria-label="Move up">↑</button>
              <button type="button" className="btn small" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label="Remove question">✕</button>
            </div>
          </div>
          <input placeholder={q.type === 'gap' ? 'Sentence with ____ where the gap goes' : 'Question or statement'} value={q.q} onChange={(e) => upd(i, { q: e.target.value })} />
          {q.type === 'mcq' && q.options.map((o, oi) => (
            <label className="optedit" key={oi}>
              <input type="radio" name={`${title}-${i}`} checked={Number(q.answer) === oi} onChange={() => upd(i, { answer: oi })} aria-label={`Option ${oi + 1} is correct`} />
              <input placeholder={`Option ${'ABCD'[oi]}`} value={o} onChange={(e) => upd(i, { options: q.options.map((x, k) => (k === oi ? e.target.value : x)) })} />
            </label>
          ))}
          {q.type === 'mcq' && <p className="muted small">Select the radio button next to the correct option.</p>}
          {(q.type === 'tfng' || q.type === 'tf') && (
            <select value={q.answer} onChange={(e) => upd(i, { answer: e.target.value })}>
              <option>True</option><option>False</option>{q.type === 'tfng' && <option>Not given</option>}
            </select>
          )}
          {q.type === 'gap' && <input placeholder="Correct answer (use | for alternatives, e.g. have been|'ve been; for short answers use ~keyword,other::model answer)" value={q.answer} onChange={(e) => upd(i, { answer: e.target.value })} />}
          <input placeholder="Explanation shown after answering (optional but helpful)" value={q.explanation} onChange={(e) => upd(i, { explanation: e.target.value })} />
        </div>
      ))}
    </div>
  );
}
