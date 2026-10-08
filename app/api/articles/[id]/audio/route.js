import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db, UPLOAD_DIR } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, unauthorized } from '@/lib/api';

const MAX_BYTES = 30 * 1024 * 1024;
const EXTS = ['.mp3', '.m4a', '.wav', '.ogg'];

export async function POST(req, { params }) {
  const user = await apiUser('teacher');
  if (!user) return unauthorized();
  const { id } = await params;
  const row = db.prepare('SELECT audio_file FROM articles WHERE id = ?').get(id);
  if (!row) return fail('Article not found.', 404);
  const file = (await req.formData()).get('file');
  if (!file || typeof file === 'string') return fail('Choose an audio file.');
  const ext = path.extname(file.name || '').toLowerCase();
  if (!EXTS.includes(ext)) return fail('Use an mp3, m4a, wav or ogg file.');
  if (file.size > MAX_BYTES) return fail('The file is larger than 30 MB.');
  const name = `${id}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  db.prepare('UPDATE articles SET audio_file = ?, updated_at = ? WHERE id = ?').run(name, new Date().toISOString(), id);
  if (row.audio_file) fs.rmSync(path.join(UPLOAD_DIR, row.audio_file), { force: true });
  return json({ ok: true, file: name });
}

export async function DELETE(_req, { params }) {
  const user = await apiUser('teacher');
  if (!user) return unauthorized();
  const { id } = await params;
  const row = db.prepare('SELECT audio_file FROM articles WHERE id = ?').get(id);
  if (row?.audio_file) fs.rmSync(path.join(UPLOAD_DIR, row.audio_file), { force: true });
  db.prepare('UPDATE articles SET audio_file = NULL WHERE id = ?').run(id);
  return json({ ok: true });
}
