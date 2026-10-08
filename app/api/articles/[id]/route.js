import fs from 'node:fs';
import path from 'node:path';
import { db, UPLOAD_DIR } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, readJson, unauthorized } from '@/lib/api';
import { validateArticle } from '@/lib/validate';
import { parseJson } from '@/lib/util';

// Fields you leave out keep their current value, so a partial update such as { comp_quiz: [...] } works.
export async function PUT(req, { params }) {
  const user = await apiUser('teacher');
  if (!user) return unauthorized();
  const { id } = await params;
  const cur = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  if (!cur) return fail('Article not found.', 404);
  const body = await readJson(req);
  const merged = {
    title: cur.title, level: cur.level, topic: cur.topic, summary: cur.summary, body: cur.body,
    body_simple: cur.body_simple, writing_prompt: cur.writing_prompt, published: Boolean(cur.published),
    glossary: parseJson(cur.glossary, []), lang_quiz: parseJson(cur.lang_quiz, []), comp_quiz: parseJson(cur.comp_quiz, []),
    ...body,
  };
  const { error, value: v } = validateArticle(merged);
  if (error) return fail(error);
  if (v.level !== cur.level && db.prepare('SELECT 1 FROM articles WHERE group_id = ? AND level = ? AND id != ?').get(cur.group_id ?? cur.id, v.level, id)) {
    return fail(`This article already has a ${v.level} version.`);
  }
  db.prepare(
    `UPDATE articles SET title=?, level=?, topic=?, summary=?, body=?, body_simple=?, glossary=?, lang_quiz=?,
     comp_quiz=?, writing_prompt=?, word_count=?, published=?, updated_at=? WHERE id=?`
  ).run(
    v.title, v.level, v.topic, v.summary, v.body, v.body_simple, JSON.stringify(v.glossary),
    JSON.stringify(v.lang_quiz), JSON.stringify(v.comp_quiz), v.writing_prompt, v.word_count, v.published,
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
