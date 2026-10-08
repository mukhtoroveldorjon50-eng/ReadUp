import fs from 'node:fs';
import path from 'node:path';
import { db, UPLOAD_DIR } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, readJson, unauthorized } from '@/lib/api';
import { validateArticle } from '@/lib/validate';

export async function PUT(req, { params }) {
  const user = await apiUser('teacher');
  if (!user) return unauthorized();
  const { id } = await params;
  if (!db.prepare('SELECT 1 FROM articles WHERE id = ?').get(id)) return fail('Article not found.', 404);
  const { error, value: v } = validateArticle(await readJson(req));
  if (error) return fail(error);
  db.prepare(
    `UPDATE articles SET title=?, level=?, topic=?, summary=?, body=?, body_simple=?, glossary=?, lang_quiz=?,
     comp_quiz=?, word_count=?, published=?, updated_at=? WHERE id=?`
  ).run(
    v.title, v.level, v.topic, v.summary, v.body, v.body_simple, JSON.stringify(v.glossary),
    JSON.stringify(v.lang_quiz), JSON.stringify(v.comp_quiz), v.word_count, v.published,
    new Date().toISOString(), id
  );
  return json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const user = await apiUser('teacher');
  if (!user) return unauthorized();
  const { id } = await params;
  const row = db.prepare('SELECT audio_file FROM articles WHERE id = ?').get(id);
  if (!row) return fail('Article not found.', 404);
  db.prepare('DELETE FROM articles WHERE id = ?').run(id);
  if (row.audio_file) fs.rmSync(path.join(UPLOAD_DIR, row.audio_file), { force: true });
  return json({ ok: true });
}
