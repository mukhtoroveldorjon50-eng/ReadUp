import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { aiEnabled, askAi } from '@/lib/ai';
import { fail, json, readJson, unauthorized } from '@/lib/api';
import { addXp } from '@/lib/stats';

export async function POST(req, { params }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const article = db.prepare('SELECT title, level, body FROM articles WHERE id = ?').get(id);
  if (!article) return fail('Article not found.', 404);
  const text = String((await readJson(req)).text ?? '').trim().slice(0, 3000);
  if (text.split(/\s+/).length < 8) return fail('Write at least a couple of sentences first.');

  let feedback = null;
  if (aiEnabled()) {
    try {
      feedback = await askAi(
        `You are a kind English teacher giving feedback to a ${user.level} learner. Reply in plain text, no markdown headings. ` +
          'Give: 1) one sentence of praise, 2) up to 4 specific corrections (quote the original, show the fix, explain briefly), ' +
          '3) one improved version of their text. Keep it short and simple.',
        `Article title: ${article.title}\nTask: summarise or give an opinion on the article.\n\nStudent text:\n${text}`
      );
    } catch {
      feedback = null;
    }
  }
  db.prepare('INSERT INTO writings (user_id, article_id, text, feedback, created_at) VALUES (?,?,?,?,?)').run(
    user.id, id, text, feedback, new Date().toISOString()
  );
  await addXp(user.id, 5);
  return json({ feedback, ai: aiEnabled() });
}
