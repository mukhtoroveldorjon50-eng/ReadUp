// Quiz questions: { type: 'mcq'|'tfng'|'gap', q, options?, answer, explanation }
//   mcq  - options[], answer = index of the right option
//   tfng - answer = 'True' | 'False' | 'Not given'
//   gap  - q contains ____, answer = 'word' or 'word|other word' for alternatives

export const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' -]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function isCorrect(q, given) {
  if (given === undefined || given === null || given === '') return false;
  if (q.type === 'mcq') return Number(given) === Number(q.answer);
  if (q.type === 'tfng') return norm(given) === norm(q.answer);
  return String(q.answer)
    .split('|')
    .some((a) => norm(a) === norm(given));
}

export function displayAnswer(q) {
  if (q.type === 'mcq') return q.options?.[q.answer] ?? '';
  if (q.type === 'tfng') return q.answer;
  return String(q.answer).split('|')[0];
}

/** What the browser may see: everything except the answer and explanation. */
export function publicQuiz(questions) {
  return questions.map(({ type, q, options }) => ({ type, q, ...(type === 'mcq' ? { options } : {}) }));
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
