import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, readJson, unauthorized } from '@/lib/api';
import { checkOne, gradeQuiz } from '@/lib/grade';
import { addXp } from '@/lib/stats';
import { parseJson } from '@/lib/util';

// Body { index, answer }  -> instant feedback on one question (nothing is stored).
// Body { answers: [...] } -> grade the whole quiz and record the attempt.
export async function POST(req, { params }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id, kind } = await params;
  if (kind !== 'lang' && kind !== 'comp') return fail('Unknown quiz.', 404);
  const row = db.prepare('SELECT lang_quiz, comp_quiz FROM articles WHERE id = ?').get(id);
  if (!row) return fail('Article not found.', 404);
  const questions = parseJson(kind === 'lang' ? row.lang_quiz : row.comp_quiz, []);
  const b = await readJson(req);

  if (b.index !== undefined) {
    const q = questions[Number(b.index)];
    if (!q) return fail('Question not found.', 404);
    return json(checkOne(q, b.answer));
  }

  if (!Array.isArray(b.answers)) return fail('No answers sent.');
  const graded = gradeQuiz(questions, b.answers);
  const best = db
    .prepare('SELECT MAX(score) s FROM quiz_attempts WHERE user_id = ? AND article_id = ? AND kind = ?')
    .get(user.id, id, kind).s;
  db.prepare(
    'INSERT INTO quiz_attempts (user_id, article_id, kind, score, max, answers, created_at) VALUES (?,?,?,?,?,?,?)'
  ).run(user.id, id, kind, graded.score, graded.max, JSON.stringify(b.answers), new Date().toISOString());
  // XP only for improving on your best, so retaking the same quiz can't be farmed.
  const improved = Math.max(0, graded.score - (best ?? 0));
  const bonus = (best ?? 0) / graded.max < 0.8 && graded.score / graded.max >= 0.8 ? 10 : 0;
  const xp = improved * 3 + bonus;
  await addXp(user.id, xp);
  return json({ ...graded, xp });
}
