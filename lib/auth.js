import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';

const SESSION_MS = 1000 * 60 * 60 * 24 * 30;

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
  db.prepare('INSERT INTO sessions (token, user_id, expires) VALUES (?,?,?)').run(
    token,
    userId,
    Date.now() + SESSION_MS
  );
  (await cookies()).set('sid', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MS / 1000,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get('sid')?.value;
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  jar.delete('sid');
}

export async function getUser() {
  const token = (await cookies()).get('sid')?.value;
  if (!token) return null;
  return (
    db
      .prepare(
        `SELECT u.id, u.name, u.email, u.role, u.level, u.native_lang, u.daily_goal FROM sessions s
         JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires > ?`
      )
      .get(token, Date.now()) ?? null
  );
}

/** For pages: redirect when not logged in or wrong role. */
export async function requireUser(role) {
  const user = await getUser();
  if (!user) redirect('/login');
  if (role && user.role !== role) redirect('/');
  return user;
}

/** For API routes: returns the user or null (caller sends 401/403). */
export async function apiUser(role) {
  const user = await getUser();
  if (!user) return null;
  if (role && user.role !== role) return null;
  return user;
}
