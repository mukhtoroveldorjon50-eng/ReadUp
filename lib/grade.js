// Quiz questions: { type: 'mcq'|'tfng'|'gap', q, options?, answer, explanation }
//   mcq  - options[], answer = index of the right option
//   tfng - answer = 'True' | 'False' | 'Not given'
//   tf   - like tfng but only True / False
//   gap  - q contains ____, answer = 'word' or 'word|other word' for alternatives
//          short answers can use keywords: '~two|2,year::about two years' means the reply must contain
//          (two or 2) and year; the part after :: is the model answer shown to the student

export const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' -]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const keywordPart = (a) => String(a).slice(1).split('::')[0];

export function isCorrect(q, given) {
  if (given === undefined || given === null || given === '') return false;
  if (q.type === 'mcq') return Number(given) === Number(q.answer);
  if (q.type === 'tfng' || q.type === 'tf') return norm(given) === norm(q.answer);
  if (String(q.answer).startsWith('~')) {
    const said = norm(given);
    return keywordPart(q.answer)
      .split(',')
      .every((k) => k.split('|').some((alt) => norm(alt) && said.includes(norm(alt))));
  }
  return String(q.answer)
    .split('|')
    .some((a) => norm(a) === norm(given));
}

export function displayAnswer(q) {
  if (q.type === 'mcq') return q.options?.[q.answer] ?? '';
  if (q.type === 'tfng' || q.type === 'tf') return q.answer;
  if (String(q.answer).startsWith('~')) return String(q.answer).split('::')[1] || keywordPart(q.answer).split(/[,|]/)[0];
  return String(q.answer).split('|')[0];
}

/** What the browser may see: everything except the answer and explanation. */
export function publicQuiz(questions) {
  return questions.map(({ type, q, options, hint }) => ({ type, q, ...(type === 'mcq' ? { options } : {}), ...(hint ? { hint } : {}) }));
}

export function checkOne(question, given) {
  return {
    correct: isCorrect(question, given),
    answer: displayAnswer(question),
    explanation: question.explanation || '',
  };
}

export function gradeQuiz(questions, answers) {
  const results = questions.map((q, i) => checkOne(q, answers?.[i]));
  return { score: results.filter((r) => r.correct).length, max: questions.length, results };
}
