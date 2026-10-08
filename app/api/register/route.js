import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { fail, json, readJson } from '@/lib/api';
import { LEVELS } from '@/lib/util';

export async function POST(req) {
  const b = await readJson(req);
  const name = String(b.name ?? '').trim().slice(0, 80);
  const email = String(b.email ?? '').trim().toLowerCase().slice(0, 200);
  const password = String(b.password ?? '');
  if (!name) return fail('Please enter your name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Please enter a valid email.');
  if (password.length < 8) return fail('The password must be at least 8 characters.');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return fail('An account with this email already exists.');
  }
  // The first account (or TEACHER_EMAIL) is the admin (role 'teacher'); everyone else is a member (role 'student').
  const first = db.prepare('SELECT COUNT(*) n FROM users').get().n === 0;
  const role = first || email === String(process.env.TEACHER_EMAIL ?? '').trim().toLowerCase() ? 'teacher' : 'student';
  const level = LEVELS.includes(b.level) ? b.level : 'B1';
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, role, level, created_at) VALUES (?,?,?,?,?,?)')
    .run(name, email, bcrypt.hashSync(password, 10), role, level, new Date().toISOString());
  await createSession(info.lastInsertRowid);
  return json({ ok: true, role });
}
