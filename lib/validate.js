import { LEVELS, wordCount } from './util';

const str = (v, max) => String(v ?? '').trim().slice(0, max);

function cleanQuestions(list, label) {
  if (!Array.isArray(list)) return { error: `${label}: questions must be a list` };
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i] || {};
    const n = `${label} question ${i + 1}`;
    const q = str(r.q, 600);
    if (!q) return { error: `${n} has no text` };
    const explanation = str(r.explanation, 600);
    if (r.type === 'mcq') {
      const options = (r.options || []).map((o) => str(o, 200)).filter(Boolean);
      const answer = Number(r.answer);
      if (options.length < 2) return { error: `${n} needs at least 2 options` };
      if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
        return { error: `${n}: pick the correct option` };
      }
      out.push({ type: 'mcq', q, options, answer, explanation });
    } else if (r.type === 'tfng') {
      const answer = ['True', 'False', 'Not given'].find((a) => a === r.answer);
      if (!answer) return { error: `${n}: answer must be True, False or Not given` };
      out.push({ type: 'tfng', q, answer, explanation });
    } else if (r.type === 'gap') {
      const answer = str(r.answer, 200);
      if (!q.includes('____')) return { error: `${n}: a gap question needs ____ in the text` };
      if (!answer) return { error: `${n}: type the correct answer` };
      out.push({ type: 'gap', q, answer, explanation });
    } else {
      return { error: `${n}: unknown question type` };
    }
  }
  return { value: out };
}

/** Validates the article form; returns { error } or { value } ready for the database. */
export function validateArticle(b) {
  const title = str(b.title, 200);
  const body = String(b.body ?? '').trim();
  if (!title) return { error: 'Please enter a title.' };
  if (!LEVELS.includes(b.level)) return { error: 'Choose a level.' };
  if (body.length < 40) return { error: 'The article text is too short.' };

  const glossary = [];
  for (const g of Array.isArray(b.glossary) ? b.glossary : []) {
    const word = str(g?.word, 60);
    if (!word) continue;
    glossary.push({
      word,
      definition: str(g.definition, 300),
      translation: str(g.translation, 200),
      example: str(g.example, 300),
    });
  }

  const lang = cleanQuestions(b.lang_quiz ?? [], 'Language quiz');
  if (lang.error) return lang;
  const comp = cleanQuestions(b.comp_quiz ?? [], 'Comprehension quiz');
  if (comp.error) return comp;

  return {
    value: {
      title,
      level: b.level,
      topic: str(b.topic, 40) || 'General',
      summary: str(b.summary, 400),
      body,
      body_simple: String(b.body_simple ?? '').trim(),
      writing_prompt: str(b.writing_prompt, 1500),
      glossary,
      lang_quiz: lang.value,
      comp_quiz: comp.value,
      word_count: wordCount(body),
      published: b.published === false ? 0 : 1,
    },
  };
}
