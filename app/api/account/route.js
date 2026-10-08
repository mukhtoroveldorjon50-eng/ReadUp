import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, readJson, unauthorized } from '@/lib/api';
import { LANGS, LEVELS } from '@/lib/util';

export async function PUT(req) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const b = await readJson(req);
  const name = String(b.name ?? '').trim().slice(0, 80);
  if (!name) return fail('Please enter your name.');
  const level = LEVELS.includes(b.level) ? b.level : user.level;
  const lang = LANGS.some(([c]) => c === b.native_lang) ? b.native_lang : user.native_lang;
  const goal = Math.min(500, Math.max(10, Math.round(Number(b.daily_goal)) || user.daily_goal));
  db.prepare('UPDATE users SET name = ?, level = ?, native_lang = ?, daily_goal = ? WHERE id = ?').run(
    name, level, lang, goal, user.id
  );
  return json({ ok: true });
}
