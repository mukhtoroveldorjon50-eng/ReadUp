import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { aiEnabled, askAi } from '@/lib/ai';
import { fail, json, readJson, unauthorized } from '@/lib/api';

// Student helper: explain a sentence, summarise the article, or answer a question about it.
export async function POST(req) {
  const user = await apiUser();
  if (!user) return unauthorized();
  if (!aiEnabled()) return fail('The AI helper is not switched on for this site.', 503);
  const b = await readJson(req);
  const article = db.prepare('SELECT title, body FROM articles WHERE id = ?').get(Number(b.article_id));
  if (!article) return fail('Article not found.', 404);
  const system =
    `You help a ${user.level}-level English learner understand an article. Use simple, clear English at that level. ` +
    'Be brief (under 150 words). Plain text only, no markdown. Never invent facts that are not in the article.';
  const text = String(b.text ?? '').trim().slice(0, 600);
  let prompt;
  if (b.action === 'summarize') prompt = `Summarise this article in 3 or 4 short sentences.\n\n${article.title}\n\n${article.body}`;
  else if (b.action === 'explain') {
    if (!text) return fail('Choose a sentence first.');
    prompt = `Explain this sentence from the article in simple English, and point out any difficult grammar or idioms.\n\nSentence: ${text}\n\nArticle:\n${article.body}`;
  } else if (b.action === 'ask') {
    if (!text) return fail('Type a question first.');
    prompt = `Answer the student's question about the article.\n\nQuestion: ${text}\n\nArticle:\n${article.title}\n\n${article.body}`;
  } else return fail('Unknown action.');
  try {
    return json({ answer: await askAi(system, prompt, 500) });
  } catch {
    return fail('The AI helper is busy. Please try again.', 502);
  }
}
