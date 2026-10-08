import { cookies } from 'next/headers';

export const LEVELS = ['A2', 'B1', 'B2', 'C1'];
export const TOPICS = [
  'Science', 'Technology', 'Culture', 'Society', 'Health', 'Environment',
  'Travel', 'Business', 'History', 'Education', 'Sport', 'Arts',
];
// [MyMemory language code, label]
export const LANGS = [
  ['', 'None (English only)'], ['uz', 'Uzbek'], ['ru', 'Russian'], ['kk', 'Kazakh'], ['tg', 'Tajik'],
  ['tr', 'Turkish'], ['ar', 'Arabic'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'],
  ['pt', 'Portuguese'], ['zh-CN', 'Chinese'], ['ja', 'Japanese'], ['ko', 'Korean'], ['hi', 'Hindi'],
];

export function wordCount(text) {
  return (String(text).match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
}

export function levelClass(level) {
  return 'lv lv-' + String(level).toLowerCase();
}

/** The student's local calendar day, using the minutes offset the browser stores in the `tz` cookie. */
export async function today(date = new Date()) {
  const raw = Number((await cookies()).get('tz')?.value);
  const offset = Number.isFinite(raw) && Math.abs(raw) <= 14 * 60 ? raw : 0;
  return new Date(date.getTime() + offset * 60000).toISOString().slice(0, 10);
}

export function dayShift(day, delta) {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function pct(score, max) {
  return max ? Math.round((score / max) * 100) : 0;
}

export function readMinutes(words) {
  return Math.max(1, Math.round(words / 200));
}

export function parseJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
