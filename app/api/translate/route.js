import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { json, unauthorized } from '@/lib/api';
import { LANGS } from '@/lib/util';

// Word/phrase translation through the free MyMemory service, cached in the database.
export async function GET(req) {
  if (!(await apiUser())) return unauthorized();
  const p = new URL(req.url).searchParams;
  const text = (p.get('text') || '').trim().slice(0, 300);
  const to = p.get('to') || '';
  if (!text || !LANGS.some(([c]) => c && c === to)) return json({ translation: '' });
  const key = `tr:${to}:${text.toLowerCase()}`;
  const cached = db.prepare('SELECT data FROM lookup_cache WHERE key = ?').get(key);
  if (cached) return json({ translation: cached.data });
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(to)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return json({ translation: '', offline: true });
    const data = await res.json();
    const translation = String(data?.responseData?.translatedText || '').trim();
    if (!translation || /MYMEMORY WARNING|INVALID/i.test(translation)) return json({ translation: '' });
    db.prepare('INSERT OR REPLACE INTO lookup_cache (key, data, created_at) VALUES (?,?,?)').run(key, translation, Date.now());
    return json({ translation });
  } catch {
    return json({ translation: '', offline: true });
  }
}
