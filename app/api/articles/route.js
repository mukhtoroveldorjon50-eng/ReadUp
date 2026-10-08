import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, readJson, unauthorized } from '@/lib/api';
import { validateArticle } from '@/lib/validate';

export async function POST(req) {
  const user = await apiUser('teacher');
  if (!user) return unauthorized();
  const { error, value: v } = validateArticle(await readJson(req));
  if (error) return fail(error);
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO articles (title, level, topic, summary, body, body_simple, glossary, lang_quiz, comp_quiz,
        writing_prompt, word_count, published, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      v.title, v.level, v.topic, v.summary, v.body, v.body_simple, JSON.stringify(v.glossary),
      JSON.stringify(v.lang_quiz), JSON.stringify(v.comp_quiz), v.writing_prompt, v.word_count, v.published, now, now
    );
  return json({ id: Number(info.lastInsertRowid) });
}
