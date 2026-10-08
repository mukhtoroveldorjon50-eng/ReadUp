import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { fail, json, readJson } from '@/lib/api';

export async function POST(req) {
  const b = await readJson(req);
  const email = String(b.email ?? '').trim().toLowerCase();
  const user = db.prepare('SELECT id, password_hash, role FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(String(b.password ?? ''), user.password_hash)) {
    return fail('Wrong email or password.', 401);
  }
  await createSession(user.id);
  return json({ ok: true, role: user.role });
}
